import { CheckCircle, Plus, RefreshCw, Search, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type React from "react";
import type { backendInterface } from "../../backend.d";
import type { Product } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";
type BodySection = { heading: string; body: string };
type FaqItem = { question: string; answer: string };
interface ActorWithDetailContent {
  updateProductDetailContent(
    productId: string,
    detailDescription: string | null,
    seoMetaTitle: string | null,
    seoMetaDescription: string | null,
    heroHeadline: string | null,
    heroSubheadline: string | null,
    bodySections: string | null,
    proofPoints: string | null,
    faqItems: string | null,
    closingCTA: string | null,
  ): Promise<{ ok: null } | { err: string }>;
}

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

/** Returns price + billing-frequency suffix based on payment_type (Feature 3) */
function formatPriceWithBilling(product: Product): string {
  const { value, type } = getActivePriceField(product);
  if (type === "none") return "Custom pricing";
  const base = `${value.toLocaleString()}`;
  const pt = product.payment_type ?? "one_time";
  if (pt === "monthly") return `${base}/mo`;
  if (pt === "quarterly") return `${base}/quarter`;
  if (pt === "deposit_50") return `${base} (50% dep.)`;
  return base;
}

type PaymentTypeValue =
  | "one_time"
  | "monthly"
  | "quarterly"
  | "annual"
  | "deposit_50";

const PAYMENT_TYPE_LABELS: Record<PaymentTypeValue, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  deposit_50: "50% Deposit",
};

function PaymentTypeBadge({ paymentType }: { paymentType: string }) {
  const pt = (paymentType ?? "one_time") as PaymentTypeValue;
  const label = PAYMENT_TYPE_LABELS[pt] ?? "One-time";
  let bg: string;
  let color: string;
  let border: string;
  if (pt === "monthly") {
    bg = "rgba(59,130,246,0.15)";
    color = "#93C5FD";
    border = "1px solid rgba(59,130,246,0.3)";
  } else if (pt === "quarterly") {
    bg = "rgba(139,92,246,0.15)";
    color = "#C4B5FD";
    border = "1px solid rgba(139,92,246,0.3)";
  } else if (pt === "annual") {
    bg = "rgba(16,185,129,0.15)";
    color = "#6EE7B7";
    border = "1px solid rgba(16,185,129,0.3)";
  } else if (pt === "deposit_50") {
    bg = "rgba(251,191,36,0.13)";
    color = "#FCD34D";
    border = "1px solid rgba(251,191,36,0.3)";
  } else {
    bg = "rgba(156,163,175,0.13)";
    color = "#9CA3AF";
    border = "1px solid rgba(156,163,175,0.25)";
  }
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        border,
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 7px",
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}

function SetupFeeBadge() {
  return (
    <span
      style={{
        display: "inline-block",
        background: "rgba(20,184,166,0.13)",
        color: "#2DD4BF",
        border: "1px solid rgba(20,184,166,0.3)",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
        padding: "2px 7px",
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      Setup Fee
    </span>
  );
}

function isSetupFeeProduct(product: Product): boolean {
  return product.name.toLowerCase().includes("setup fee");
}

function groupByCategory(products: Product[]): [string, Product[]][] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.product_type;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
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
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("");

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetType, setBulkTargetType] = useState<string>("");
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const handleSetSearchQuery = useCallback((val: string) => {
    setSearchQuery(val);
  }, []);

  const handleSetCategoryFilter = useCallback((val: string) => {
    setCategoryFilter(val);
  }, []);

  const handleSetPaymentTypeFilter = useCallback((val: string) => {
    setPaymentTypeFilter(val);
  }, []);

  const bulkLabelMap: Record<string, string> = {
    one_time: "One-time",
    monthly: "Monthly",
    quarterly: "Quarterly",
    deposit_50: "50% Deposit",
  };

  const handleRowSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkTypeSelect = useCallback((val: string) => {
    if (!val) return;
    setBulkTargetType(val);
    setBulkConfirming(true);
    setBulkError("");
  }, []);

  const handleBulkCancel = useCallback(() => {
    setBulkConfirming(false);
    setBulkTargetType("");
    setBulkError("");
  }, []);

  // Edit state: which product ID is being edited, and the current input value
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editPriceMonthly, setEditPriceMonthly] = useState<string>("");
  const [editPriceAnnual, setEditPriceAnnual] = useState<string>("");
  const [editPriceOnetime, setEditPriceOnetime] = useState<string>("");
  const [editImageUrl, setEditImageUrl] = useState<string>("");
  const [addImageUrl, setAddImageUrl] = useState<string>("");
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [editDescription, setEditDescription] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editFeatureBullets, setEditFeatureBullets] = useState("");
  const [editBestFor, setEditBestFor] = useState("");
  const [editUpgradePath, setEditUpgradePath] = useState("");
  const [editRecommendedPlan, setEditRecommendedPlan] = useState("");
  const [editPaymentType, setEditPaymentType] = useState<string>("one_time");
  const [editPlanSection, setEditPlanSection] = useState<string>("");
  const [editSpeedyFilter, setEditSpeedyFilter] = useState<string>("");
  const [editVideoUrl1, setEditVideoUrl1] = useState<string>("");
  const [editVideoUrl2, setEditVideoUrl2] = useState<string>("");
  const [editShowQuestionnaire, setEditShowQuestionnaire] =
    useState<boolean>(false);
  const [editDetailDescription, setEditDetailDescription] =
    useState<string>("");
  const [editSeoMetaTitle, setEditSeoMetaTitle] = useState<string>("");
  const [editSeoMetaDescription, setEditSeoMetaDescription] =
    useState<string>("");
  const [editHeroHeadline, setEditHeroHeadline] = useState<string>("");
  const [editHeroSubheadline, setEditHeroSubheadline] = useState<string>("");
  const [editClosingCTA, setEditClosingCTA] = useState<string>("");
  const [editBodySectionsArr, setEditBodySectionsArr] = useState<BodySection[]>(
    [],
  );
  const [editProofPointsArr, setEditProofPointsArr] = useState<string[]>([]);
  const [editFaqItemsArr, setEditFaqItemsArr] = useState<FaqItem[]>([]);
  const [editSeoSectionOpen, setEditSeoSectionOpen] = useState<boolean>(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(
    null,
  );

  const uploadProductImage = async (file: File): Promise<string> => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const storage = (window as Window & { __icpBlobStorage?: unknown })
        .__icpBlobStorage;
      const blob = (
        storage as
          | {
              ExternalBlob?: {
                fromBytes: (b: Uint8Array) => {
                  getDirectURL: () => Promise<string>;
                };
              };
            }
          | undefined
      )?.ExternalBlob?.fromBytes(bytes);
      if (!blob) return "";
      return await blob.getDirectURL();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Image upload failed:", err);
      }
      return "";
    }
  };

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
        const raw = await extActor.getAllProductsAdmin();
        const result: Product[] = Array.isArray(raw) ? (raw as Product[]) : [];

        // If the backend explicitly returns an empty array, that is a valid empty catalog — do not retry
        if (result.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Success — commit data and exit
        setProducts(result);
        setLoading(false);
        return;
      } catch (err: unknown) {
        if (import.meta.env.DEV) {
          console.error(`fetchProducts error (attempt ${attempt + 1}):`, err);
        }
        if (attempt < MAX_ATTEMPTS - 1) {
          if (import.meta.env.DEV) {
            console.warn(`Retrying in ${RETRY_DELAYS[attempt]}ms…`);
          }
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

  const handleBulkConfirm = useCallback(async () => {
    if (!bulkTargetType || !actor) return;
    setBulkSaving(true);
    setBulkError("");
    try {
      const extActor = actor as backendInterface;
      const ids = [...selectedIds];
      for (const id of ids) {
        await extActor.updateProductPaymentType(id, bulkTargetType);
      }
      setSelectedIds(new Set());
      setBulkConfirming(false);
      setBulkTargetType("");
      fetchProducts();
    } catch {
      setBulkError("Failed to update payment types. Please try again.");
    } finally {
      setBulkSaving(false);
    }
  }, [actor, bulkTargetType, selectedIds, fetchProducts]);

  const fetchPortalShopIds = useCallback(async () => {
    if (!actor || isFetching) return;
    const extActor = actor as backendInterface;
    if (!extActor.getPortalShopProductIds) return;
    try {
      const ids = (await extActor.getPortalShopProductIds()).map((id) =>
        String(id),
      );
      setPortalShopIds(new Set(ids));
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error("Failed to load portal shop IDs:", err);
      }
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
      if (import.meta.env.DEV) {
        console.error("Failed to load category visibility:", err);
      }
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
        if (import.meta.env.DEV) {
          console.error("Category toggle failed:", result.err);
        }
        const { toast: toastFn } = await import("sonner");
        toastFn.error(
          `Failed to update "${category}" visibility: ${result.err}`,
        );
      } else {
        const { toast: toastFn } = await import("sonner");
        const newState = !currentVisible;
        toastFn.success(
          newState
            ? `"${category}" category is now visible`
            : `"${category}" category is now hidden`,
        );
      }
    } catch (err) {
      // Revert on error
      setCategoryVisibility((prev) => {
        const next = new Map(prev);
        next.set(category, currentVisible);
        return next;
      });
      if (import.meta.env.DEV) {
        console.error("Category toggle error:", err);
      }
      const { toast: toastFn } = await import("sonner");
      toastFn.error(
        err instanceof Error
          ? err.message
          : `Failed to update "${category}" visibility.`,
      );
    } finally {
      setCategoryTogglingSet((prev) => {
        const next = new Set(prev);
        next.delete(category);
        return next;
      });
    }
  };

  const handleEditStart = async (product: Product) => {
    const { value } = getActivePriceField(product);
    setEditingId(String(product.id));
    // Show the raw number so user edits a pure number (e.g. 749, not "$749")
    setEditValue(value > 0 ? String(value) : "");
    setEditPriceMonthly(
      product.price_monthly != null ? String(product.price_monthly) : "",
    );
    setEditPriceAnnual(
      product.price_annual != null ? String(product.price_annual) : "",
    );
    setEditPriceOnetime(
      product.price_onetime != null ? String(product.price_onetime) : "",
    );
    // Use plain description from backend (never JSON blob)
    setEditDescription(product.description ?? "");
    // Load rich fields from backend Product fields
    setEditTagline(product.tagline ?? "");
    setEditFeatureBullets(
      (product.featureBullets?.length ? product.featureBullets : []).join("\n"),
    );
    setEditBestFor(product.bestFor ?? "");
    setEditUpgradePath(product.upgradePath ?? "");
    setEditRecommendedPlan(product.recommendedPlan ?? "");
    setEditPaymentType(product.payment_type ?? "one_time");
    setEditPlanSection(product.plan_section ?? "");
    setEditSpeedyFilter(
      (product as Product & { speedy_filter?: string }).speedy_filter ?? "",
    );
    setEditVideoUrl1(product.video_url_1 ?? "");
    setEditVideoUrl2(product.video_url_2 ?? "");
    setEditShowQuestionnaire(product.show_questionnaire ?? false);
    setEditDetailDescription(product.detailDescription ?? "");
    setEditSeoMetaTitle(product.seoMetaTitle ?? "");
    setEditSeoMetaDescription(product.seoMetaDescription ?? "");
    setEditHeroHeadline(product.heroHeadline ?? "");
    setEditHeroSubheadline(product.heroSubheadline ?? "");
    setEditClosingCTA(product.closingCTA ?? "");
    setEditSeoSectionOpen(false);
    try {
      setEditBodySectionsArr(
        JSON.parse(product.bodySections ?? "[]") as BodySection[],
      );
    } catch {
      setEditBodySectionsArr([]);
    }
    try {
      setEditProofPointsArr(
        JSON.parse(product.proofPoints ?? "[]") as string[],
      );
    } catch {
      setEditProofPointsArr([]);
    }
    try {
      setEditFaqItemsArr(JSON.parse(product.faqItems ?? "[]") as FaqItem[]);
    } catch {
      setEditFaqItemsArr([]);
    }
    // Pre-populate image URL directly from the already-loaded product record.
    // Falls back to a backend fetch only if the product's imageUrl is absent.
    const preloadedImage = product.imageUrl ?? null;
    if (preloadedImage !== null && preloadedImage !== "") {
      setEditImageUrl(preloadedImage);
    } else {
      try {
        const extActor = actor as backendInterface;
        const result = await extActor.getProductImageUrl(BigInt(product.id));
        setEditImageUrl(result ?? "");
      } catch {
        setEditImageUrl("");
      }
    }
    setPriceError(null);
    setSaveSuccess(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
    setEditDescription("");
    setPriceError(null);
    setSaveSuccess(null);
  };

  /** Validate price value — returns null if valid, error string if invalid */
  /** Validate price value — returns null if valid, error string if invalid.
   * An empty value is always valid in a multi-price form (another field may be filled).
   */
  function validatePrice(raw: string): string | null {
    // Empty means this price type is not being set — that's fine in a multi-price form
    if (raw.trim() === "") return null;
    const num = Number.parseFloat(raw);
    if (Number.isNaN(num)) return "Enter a valid number.";
    if (num <= 0) return "Price must be greater than $0.";
    if (num < 0.5) return "Price must be at least $0.50 (Stripe minimum).";
    return null;
  }

  const handleEditSave = async (product: Product) => {
    if (!actor) return;

    // Validate the actively edited price field only if it has content.
    // Empty fields are valid — another price type may already be filled.
    const validationError = validatePrice(editValue);
    if (validationError) {
      setPriceError(validationError);
      return;
    }
    // Ensure at least one price field is filled
    const anyPriceFilled =
      editPriceMonthly.trim() !== "" ||
      editPriceAnnual.trim() !== "" ||
      editPriceOnetime.trim() !== "";
    if (!anyPriceFilled) {
      setPriceError("At least one price field must have a value.");
      return;
    }

    const monthly: number | null =
      editPriceMonthly !== "" ? Number.parseFloat(editPriceMonthly) : null;
    const annual: number | null =
      editPriceAnnual !== "" ? Number.parseFloat(editPriceAnnual) : null;
    const onetime: number | null =
      editPriceOnetime !== "" ? Number.parseFloat(editPriceOnetime) : null;

    const extActor = actor as backendInterface;
    setIsSaving(true);

    try {
      const result = await extActor.updateProductPrice(
        String(product.id),
        monthly,
        annual,
        onetime,
      );
      if (result && "err" in result) {
        if (import.meta.env.DEV) {
          console.error("Price update failed:", result.err);
        }
        const { toast: toastFn } = await import("sonner");
        toastFn.error(`Failed to update price: ${result.err}`);
        setIsSaving(false);
        return;
      }

      // Save plain description text to backend (never JSON blob)
      if (extActor.updateProductDescription) {
        try {
          await extActor.updateProductDescription(
            String(product.id),
            editDescription,
          );
        } catch (descErr) {
          if (import.meta.env.DEV) {
            console.error("Description update error:", descErr);
          }
          // Non-fatal — price already saved, show a warning toast
          const { toast: toastFn } = await import("sonner");
          toastFn.error("Price saved, but description update failed.");
        }
      }

      // Persist rich fields to backend
      if (extActor.updateProductRichFields) {
        try {
          await extActor.updateProductRichFields(
            String(product.id),
            editTagline.trim() || null,
            editFeatureBullets
              .split("\n")
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
              .slice(0, 10),
            editBestFor.trim() || null,
            editUpgradePath.trim() || null,
            editRecommendedPlan.trim() || null,
            editVideoUrl1,
            editVideoUrl2,
            editShowQuestionnaire,
          );
        } catch (richErr) {
          if (import.meta.env.DEV) {
            console.error("Rich fields update error:", richErr);
          }
          const { toast: toastFn } = await import("sonner");
          toastFn.error("Price saved, but rich fields update failed.");
        }
      }

      // Update detail content fields
      await (
        extActor as unknown as ActorWithDetailContent
      ).updateProductDetailContent(
        String(product.id),
        editDetailDescription.trim() || null,
        editSeoMetaTitle.trim() || null,
        editSeoMetaDescription.trim() || null,
        editHeroHeadline.trim() || null,
        editHeroSubheadline.trim() || null,
        editBodySectionsArr.length > 0
          ? JSON.stringify(editBodySectionsArr)
          : null,
        editProofPointsArr.length > 0
          ? JSON.stringify(editProofPointsArr)
          : null,
        editFaqItemsArr.length > 0 ? JSON.stringify(editFaqItemsArr) : null,
        editClosingCTA.trim() || null,
      );

      // Persist payment type
      if (extActor.updateProductPaymentType) {
        try {
          await extActor.updateProductPaymentType(
            String(product.id),
            editPaymentType,
          );
        } catch (ptErr) {
          if (import.meta.env.DEV) {
            console.error("Payment type update error:", ptErr);
          }
          const { toast: toastFn } = await import("sonner");
          toastFn.error("Price saved, but payment type update failed.");
        }
      }

      // Update plan section
      try {
        await (actor as backendInterface).updateProductPlanSection(
          BigInt(product.id),
          editPlanSection || null,
        );
      } catch (e) {
        console.error("Failed to update plan section:", e);
        const { toast: toastFn } = await import("sonner");
        toastFn.error("Failed to save Plan Section. Please try again.");
      }

      // Update speedy filter
      try {
        await (actor as backendInterface).updateProductSpeedyFilter(
          BigInt(product.id),
          editSpeedyFilter || null,
        );
      } catch (e) {
        console.error("Failed to update speedy filter:", e);
        const { toast: toastFn } = await import("sonner");
        toastFn.error("Failed to save Speedy Filter. Please try again.");
      }

      // Persist image URL (pass empty string to explicitly clear the image)
      try {
        await extActor.updateProductImage(String(product.id), editImageUrl);
      } catch {
        const { toast: toastFn } = await import("sonner");
        toastFn.error("Failed to save image. Please try again.");
        setIsSaving(false);
        return;
      }

      // Clear edit state AFTER confirmed backend response
      setEditingId(null);
      setEditValue("");
      setEditDescription("");
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
        if (import.meta.env.DEV) {
          console.error("Price refresh error:", refreshErr);
        }
        fetchProducts();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Price update error:", err);
      }
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
      let productIdBigInt: bigint;
      try {
        productIdBigInt = BigInt(productId);
      } catch {
        const { toast: toastFn } = await import("sonner");
        toastFn.error(
          "Invalid product ID — cannot toggle portal shop product.",
        );
        // Revert optimistic update
        setPortalShopIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyEnabled) next.add(productId);
          else next.delete(productId);
          return next;
        });
        setPortalShopTogglingSet((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        return;
      }
      const result = await extActor.togglePortalShopProduct(productIdBigInt);
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
      if (import.meta.env.DEV) {
        console.error("Portal shop toggle error:", err);
      }
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

  const handleRemoveImage = async (productId: string) => {
    if (!actor) return;
    try {
      const result = await actor.removeProductImage(BigInt(productId));
      if ("ok" in result) {
        const updatedProducts = await (
          actor as backendInterface
        ).getAllProductsAdmin();
        setProducts(updatedProducts);
      } else {
        const { toast: toastFn } = await import("sonner");
        toastFn.error("Failed to remove image. Please try again.");
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error removing image:", err);
      }
      const { toast: toastFn } = await import("sonner");
      toastFn.error("Failed to remove image. Please try again.");
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
      const result = await extActor.toggleProductStatus(productId);
      if (result && "err" in result) {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) =>
            String(p.id) === productId ? { ...p, active: currentActive } : p,
          ),
        );
        if (import.meta.env.DEV) {
          console.error("Toggle failed:", result.err);
        }
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
      if (import.meta.env.DEV) {
        console.error("Toggle error:", err);
      }
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
    return (
      matchesSearch &&
      matchesCategory &&
      (paymentTypeFilter === "" || p.payment_type === paymentTypeFilter)
    );
  });

  const visibleProductIds = useMemo(
    () => new Set<string>(filteredProducts.map((p) => String(p.id))),
    [filteredProducts],
  );

  const handleSelectAll = useCallback(() => {
    const vids = new Set<string>(filteredProducts.map((p) => String(p.id)));
    if (vids.size === 0) return;
    const allSelected = [...vids].every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vids));
    }
  }, [filteredProducts, selectedIds]);
  const grouped = groupByCategory(filteredProducts);

  // ── Add New modal state ──────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addNewCategoryText, setAddNewCategoryText] = useState<string>("");
  const [addPriceMonthly, setAddPriceMonthly] = useState("");
  const [addPriceAnnual, setAddPriceAnnual] = useState("");
  const [addPriceOnetime, setAddPriceOnetime] = useState("");
  const [addTagline, setAddTagline] = useState("");
  const [addFeatureBullets, setAddFeatureBullets] = useState("");
  const [addBestFor, setAddBestFor] = useState("");
  const [addUpgradePath, setAddUpgradePath] = useState("");
  const [addRecommendedPlan, setAddRecommendedPlan] = useState("");
  const [addPaymentType, setAddPaymentType] = useState<string>("one_time");
  const [addPlanSection, setAddPlanSection] = useState<string>("");
  const [addVideoUrl1, setAddVideoUrl1] = useState<string>("");
  const [addVideoUrl2, setAddVideoUrl2] = useState<string>("");
  const [addSpeedyFilter, setAddSpeedyFilter] = useState<string>("");
  const [addShowQuestionnaire, setAddShowQuestionnaire] =
    useState<boolean>(false);
  const [addDetailDescription, setAddDetailDescription] = useState<string>("");
  const [addSeoMetaTitle, setAddSeoMetaTitle] = useState<string>("");
  const [addSeoMetaDescription, setAddSeoMetaDescription] =
    useState<string>("");
  const [addHeroHeadline, setAddHeroHeadline] = useState<string>("");
  const [addHeroSubheadline, setAddHeroSubheadline] = useState<string>("");
  const [addClosingCTA, setAddClosingCTA] = useState<string>("");
  const [addBodySectionsArr, setAddBodySectionsArr] = useState<BodySection[]>(
    [],
  );
  const [addProofPointsArr, setAddProofPointsArr] = useState<string[]>([]);
  const [addFaqItemsArr, setAddFaqItemsArr] = useState<FaqItem[]>([]);
  const [addSeoSectionOpen, setAddSeoSectionOpen] = useState<boolean>(false);
  const [addErrors, setAddErrors] = useState<{
    name?: string;
    category?: string;
    price?: string;
  }>({});
  const [isAdding, setIsAdding] = useState(false);

  const resetAddForm = () => {
    setAddName("");
    setAddDescription("");
    setAddCategory("");
    setAddPriceMonthly("");
    setAddPriceAnnual("");
    setAddPriceOnetime("");
    setAddErrors({});
    setAddTagline("");
    setAddFeatureBullets("");
    setAddBestFor("");
    setAddUpgradePath("");
    setAddRecommendedPlan("");
    setAddImageUrl("");
    setAddNewCategoryText("");
    setAddPaymentType("one_time");
    setAddPlanSection("");
    setAddVideoUrl1("");
    setAddVideoUrl2("");
    setAddDetailDescription("");
    setAddSeoMetaTitle("");
    setAddSeoMetaDescription("");
    setAddHeroHeadline("");
    setAddHeroSubheadline("");
    setAddClosingCTA("");
    setAddBodySectionsArr([]);
    setAddProofPointsArr([]);
    setAddFaqItemsArr([]);
    setAddSeoSectionOpen(false);
    setAddShowQuestionnaire(false);
  };

  const handleOpenAddModal = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetAddForm();
  };

  const handleAddSave = async () => {
    const resolvedCategory =
      addCategory === "__new__" ? addNewCategoryText.trim() : addCategory;
    const errors: { name?: string; category?: string; price?: string } = {};
    if (!addName.trim()) errors.name = "Service name is required.";
    if (!resolvedCategory) errors.category = "Category is required.";

    const monthly =
      addPriceMonthly !== "" ? Number.parseFloat(addPriceMonthly) : null;
    const annual =
      addPriceAnnual !== "" ? Number.parseFloat(addPriceAnnual) : null;
    const onetime =
      addPriceOnetime !== "" ? Number.parseFloat(addPriceOnetime) : null;
    const hasValidPrice =
      (monthly !== null && monthly > 0) ||
      (annual !== null && annual > 0) ||
      (onetime !== null && onetime > 0);
    if (!hasValidPrice)
      errors.price =
        "At least one price field must have a value greater than $0.";

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    if (!actor) return;
    setIsAdding(true);
    try {
      const result = await (actor as backendInterface).createProduct(
        addName.trim(),
        addDescription.trim(),
        resolvedCategory,
        monthly,
        annual,
        onetime,
        addTagline.trim() ? addTagline.trim() : null,
        addFeatureBullets
          .split("\n")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .slice(0, 10),
        addBestFor.trim() ? addBestFor.trim() : null,
        addUpgradePath.trim() ? addUpgradePath.trim() : null,
        addRecommendedPlan.trim() ? addRecommendedPlan.trim() : null,
        addPaymentType,
        addVideoUrl1,
        addVideoUrl2,
        addShowQuestionnaire,
        addPlanSection || null,
        addSpeedyFilter || null,
      );
      if (result && "err" in result) {
        const { toast: toastFn } = await import("sonner");
        toastFn.error(`Failed to create service: ${result.err}`);
      } else {
        const { toast: toastFn } = await import("sonner");
        toastFn.success("Service created successfully.");
        if (
          addImageUrl &&
          result &&
          "ok" in result &&
          result.ok !== undefined
        ) {
          try {
            await (actor as backendInterface).updateProductImage(
              String(result.ok),
              addImageUrl,
            );
          } catch {
            const { toast: toastFn } = await import("sonner");
            toastFn.error("Failed to save image. Please try again.");
            setIsAdding(false);
            return;
          }
        }
        // Update detail content fields for new product
        if (result && "ok" in result && result.ok !== undefined) {
          const createdProductId = result.ok;
          await (
            actor as unknown as ActorWithDetailContent
          ).updateProductDetailContent(
            String(createdProductId),
            addDetailDescription.trim() || null,
            addSeoMetaTitle.trim() || null,
            addSeoMetaDescription.trim() || null,
            addHeroHeadline.trim() || null,
            addHeroSubheadline.trim() || null,
            addBodySectionsArr.length > 0
              ? JSON.stringify(addBodySectionsArr)
              : null,
            addProofPointsArr.length > 0
              ? JSON.stringify(addProofPointsArr)
              : null,
            addFaqItemsArr.length > 0 ? JSON.stringify(addFaqItemsArr) : null,
            addClosingCTA.trim() || null,
          );
        }
        if (
          addPlanSection &&
          actor &&
          result &&
          "ok" in result &&
          result.ok !== undefined
        ) {
          try {
            await (actor as backendInterface).updateProductPlanSection(
              BigInt(result.ok),
              addPlanSection,
            );
          } catch (e) {
            console.error("Failed to set plan section:", e);
          }
        }
        handleCloseAddModal();
        fetchProducts();
      }
    } catch (err) {
      const { toast: toastFn } = await import("sonner");
      toastFn.error(
        err instanceof Error ? err.message : "Failed to create service.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <AdminLayout pageTitle="Services">
      {/* Add New Modal */}
      {showAddModal && (
        <dialog
          data-ocid="products.add_modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseAddModal();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCloseAddModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "#111322",
              border: "1px solid rgba(226,232,240,0.6)",
              borderRadius: "16px",
              padding: "32px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  color: "#EEF0F8",
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                <TypewriterText
                  className="matrix-heading"
                  text="Add New Service"
                />
              </h2>
              <button
                type="button"
                data-ocid="products.add_modal.close_button"
                onClick={handleCloseAddModal}
                aria-label="Close modal"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "8px",
                  color: "#7A7D90",
                  fontSize: "18px",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  lineHeight: 1,
                  transition: "color 0.15s, border-color 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EEF0F8";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#7A7D90";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
              >
                ×
              </button>
            </div>

            {/* Service Name */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="add-name"
                style={{
                  display: "block",
                  color: "#22C55E",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "7px",
                }}
              >
                Service Name <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                id="add-name"
                type="text"
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value);
                  if (addErrors.name)
                    setAddErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Starter Custom Site"
                data-ocid="products.add_modal.name_input"
                aria-invalid={!!addErrors.name}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.6)",
                  border: addErrors.name
                    ? "1px solid #f87171"
                    : "1px solid rgba(226,232,240,0.8)",
                  borderRadius: "6px",
                  color: "#EEF0F8",
                  fontSize: "13px",
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  if (!addErrors.name)
                    e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
                }}
                onBlur={(e) => {
                  if (!addErrors.name)
                    e.currentTarget.style.borderColor = "rgba(226,232,240,0.8)";
                }}
              />
              {addErrors.name && (
                <span
                  data-ocid="products.add_modal.name_input.field_error"
                  style={{
                    color: "#f87171",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  {addErrors.name}
                </span>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="add-description"
                style={{
                  display: "block",
                  color: "#22C55E",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "7px",
                }}
              >
                Description{" "}
                <span style={{ color: "#7A7D90", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <textarea
                id="add-description"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Short description of the service…"
                rows={3}
                data-ocid="products.add_modal.description_textarea"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(226,232,240,0.8)",
                  borderRadius: "6px",
                  color: "#EEF0F8",
                  fontSize: "13px",
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(226,232,240,0.8)";
                }}
              />
            </div>

            <div>
              <label
                htmlFor="add-detail-description"
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "6px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Detail Page Description
                <span
                  style={{
                    display: "block",
                    color: "#888",
                    fontSize: "11px",
                    marginTop: "2px",
                    fontWeight: "normal",
                  }}
                >
                  Shown on the full product detail page. If left blank, the card
                  description above will be used.
                </span>
              </label>
              <textarea
                id="add-detail-description"
                value={addDetailDescription}
                onChange={(e) => setAddDetailDescription(e.target.value)}
                rows={4}
                placeholder="Long-form description for the product detail page..."
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(226,232,240,0.8)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  resize: "vertical",
                  minHeight: "80px",
                }}
              />
            </div>
            {/* Product Image */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="add-product-image"
                style={{
                  display: "block",
                  color: "#22C55E",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "7px",
                }}
              >
                Product Image{" "}
                <span style={{ color: "#7A7D90", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                id="add-product-image"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    setImageUploading(true);
                    const url = await uploadProductImage(e.target.files[0]);
                    setAddImageUrl(url);
                    setImageUploading(false);
                  }
                }}
                className="block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
              />
              {imageUploading && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#7A7D90",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  Uploading...
                </span>
              )}
              {addImageUrl && (
                <img
                  src={addImageUrl}
                  alt="Product preview"
                  style={{
                    marginTop: "8px",
                    height: "64px",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
              )}
            </div>

            {/* Tagline */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="add-tagline"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#B0B3C6",
                  marginBottom: "6px",
                }}
              >
                Tagline{" "}
                <span style={{ fontWeight: 400, color: "#7A7D90" }}>
                  (optional)
                </span>
              </label>
              <input
                id="add-tagline"
                type="text"
                value={addTagline}
                onChange={(e) => setAddTagline(e.target.value)}
                placeholder="Short one-liner shown on the detail card…"
                style={{
                  width: "100%",
                  background: "#1A1B2E",
                  border: "1px solid #2E3150",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#EEF0F8",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            {/* Feature Bullets */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="add-feature-bullets"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#B0B3C6",
                  marginBottom: "6px",
                }}
              >
                Feature Bullets{" "}
                <span style={{ fontWeight: 400, color: "#7A7D90" }}>
                  (up to 10, one per line)
                </span>
              </label>
              <textarea
                id="add-feature-bullets"
                value={addFeatureBullets}
                onChange={(e) => setAddFeatureBullets(e.target.value)}
                rows={5}
                placeholder="Each line becomes one bullet point on the detail card…"
                style={{
                  width: "100%",
                  background: "#1A1B2E",
                  border: "1px solid #2E3150",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#EEF0F8",
                  fontSize: "0.9rem",
                  resize: "vertical",
                }}
              />
            </div>
            {/* Best For */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="add-best-for"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#B0B3C6",
                  marginBottom: "6px",
                }}
              >
                Best For{" "}
                <span style={{ fontWeight: 400, color: "#7A7D90" }}>
                  (optional)
                </span>
              </label>
              <input
                id="add-best-for"
                type="text"
                value={addBestFor}
                onChange={(e) => setAddBestFor(e.target.value)}
                placeholder="Who is this service best for?"
                style={{
                  width: "100%",
                  background: "#1A1B2E",
                  border: "1px solid #2E3150",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#EEF0F8",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            {/* Upgrade Path */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="add-upgrade-path"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#B0B3C6",
                  marginBottom: "6px",
                }}
              >
                Upgrade Path{" "}
                <span style={{ fontWeight: 400, color: "#7A7D90" }}>
                  (optional)
                </span>
              </label>
              <input
                id="add-upgrade-path"
                type="text"
                value={addUpgradePath}
                onChange={(e) => setAddUpgradePath(e.target.value)}
                placeholder="e.g. Upgrade to the Pro plan for advanced features"
                style={{
                  width: "100%",
                  background: "#1A1B2E",
                  border: "1px solid #2E3150",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#EEF0F8",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            {/* Recommended Plan */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="add-recommended-plan"
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#B0B3C6",
                  marginBottom: "6px",
                }}
              >
                Recommended Plan{" "}
                <span style={{ fontWeight: 400, color: "#7A7D90" }}>
                  (optional)
                </span>
              </label>
              <input
                id="add-recommended-plan"
                type="text"
                value={addRecommendedPlan}
                onChange={(e) => setAddRecommendedPlan(e.target.value)}
                placeholder="e.g. Growth Hub Pro"
                style={{
                  width: "100%",
                  background: "#1A1B2E",
                  border: "1px solid #2E3150",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#EEF0F8",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            {/* Category */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="add-category"
                style={{
                  display: "block",
                  color: "#EEF0F8",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "7px",
                }}
              >
                Category <span style={{ color: "#f87171" }}>*</span>
              </label>
              <select
                id="add-category"
                value={addCategory}
                onChange={(e) => {
                  setAddCategory(e.target.value);
                  if (addErrors.category)
                    setAddErrors((prev) => ({ ...prev, category: undefined }));
                }}
                data-ocid="products.add_modal.category_select"
                aria-invalid={!!addErrors.category}
                style={{
                  width: "100%",
                  padding: "10px 32px 10px 12px",
                  background: "rgba(17,19,34,0.8)",
                  border: addErrors.category
                    ? "1px solid #f87171"
                    : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: addCategory ? "#EEF0F8" : "#7A7D90",
                  fontSize: "13px",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7D90' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  if (!addErrors.category)
                    e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
                }}
                onBlur={(e) => {
                  if (!addErrors.category)
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <option value="">Select a category…</option>
                {[...new Set(products.map((p: Product) => p.product_type))]
                  .sort()
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                <option value="__new__">＋ Add new category…</option>
              </select>
              {addCategory === "__new__" && (
                <input
                  type="text"
                  placeholder="Type new category name…"
                  value={addNewCategoryText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAddNewCategoryText(e.target.value);
                    if (addErrors.category)
                      setAddErrors((prev) => ({
                        ...prev,
                        category: undefined,
                      }));
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "rgba(0,0,0,0.6)",
                    border: addErrors.category
                      ? "1px solid #f87171"
                      : "1px solid rgba(226,232,240,0.8)",
                    borderRadius: "6px",
                    color: "#EEF0F8",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                    marginTop: "8px",
                  }}
                  onFocus={(e) => {
                    if (!addErrors.category)
                      e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
                  }}
                  onBlur={(e) => {
                    if (!addErrors.category)
                      e.currentTarget.style.borderColor =
                        "rgba(226,232,240,0.8)";
                  }}
                />
              )}
              {addErrors.category && (
                <span
                  data-ocid="products.add_modal.category_select.field_error"
                  style={{
                    color: "#f87171",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  {addErrors.category}
                </span>
              )}
            </div>

            {/* Prices */}
            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  display: "block",
                  color: "#EEF0F8",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Pricing{" "}
                <span style={{ color: "#7A7D90", fontWeight: 400 }}>
                  (at least one required)
                </span>
              </span>
              <span
                style={{
                  display: "block",
                  color: "#7A7D90",
                  fontSize: "12px",
                  marginBottom: "12px",
                }}
              >
                Enter plain numbers without $ (e.g. 749). Leave fields blank if
                not applicable.
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                }}
              >
                {/* Monthly */}
                <div>
                  <label
                    htmlFor="add-price-monthly"
                    style={{
                      display: "block",
                      color: "#7A7D90",
                      fontSize: "11px",
                      fontWeight: 600,
                      marginBottom: "5px",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    Monthly
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#22C55E",
                        fontSize: "13px",
                        fontWeight: 700,
                        pointerEvents: "none",
                      }}
                    >
                      $
                    </span>
                    <input
                      id="add-price-monthly"
                      type="number"
                      min="0"
                      step="any"
                      value={addPriceMonthly}
                      onChange={(e) => {
                        setAddPriceMonthly(e.target.value);
                        if (addErrors.price)
                          setAddErrors((prev) => ({
                            ...prev,
                            price: undefined,
                          }));
                      }}
                      placeholder="e.g. 99"
                      data-ocid="products.add_modal.price_monthly_input"
                      style={{
                        width: "100%",
                        paddingLeft: "22px",
                        paddingRight: "8px",
                        paddingTop: "9px",
                        paddingBottom: "9px",
                        background: "rgba(17,19,34,0.8)",
                        border: addErrors.price
                          ? "1px solid #f87171"
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#EEF0F8",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(226,232,240,1)";
                      }}
                      onBlur={(e) => {
                        if (!addErrors.price)
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)";
                      }}
                    />
                  </div>
                </div>
                {/* Annual */}
                <div>
                  <label
                    htmlFor="add-price-annual"
                    style={{
                      display: "block",
                      color: "#7A7D90",
                      fontSize: "11px",
                      fontWeight: 600,
                      marginBottom: "5px",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    Annual
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#22C55E",
                        fontSize: "13px",
                        fontWeight: 700,
                        pointerEvents: "none",
                      }}
                    >
                      $
                    </span>
                    <input
                      id="add-price-annual"
                      type="number"
                      min="0"
                      step="any"
                      value={addPriceAnnual}
                      onChange={(e) => {
                        setAddPriceAnnual(e.target.value);
                        if (addErrors.price)
                          setAddErrors((prev) => ({
                            ...prev,
                            price: undefined,
                          }));
                      }}
                      placeholder="e.g. 999"
                      data-ocid="products.add_modal.price_annual_input"
                      style={{
                        width: "100%",
                        paddingLeft: "22px",
                        paddingRight: "8px",
                        paddingTop: "9px",
                        paddingBottom: "9px",
                        background: "rgba(17,19,34,0.8)",
                        border: addErrors.price
                          ? "1px solid #f87171"
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#EEF0F8",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(226,232,240,1)";
                      }}
                      onBlur={(e) => {
                        if (!addErrors.price)
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)";
                      }}
                    />
                  </div>
                </div>
                {/* One-time */}
                <div>
                  <label
                    htmlFor="add-price-onetime"
                    style={{
                      display: "block",
                      color: "#7A7D90",
                      fontSize: "11px",
                      fontWeight: 600,
                      marginBottom: "5px",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    One-Time
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#22C55E",
                        fontSize: "13px",
                        fontWeight: 700,
                        pointerEvents: "none",
                      }}
                    >
                      $
                    </span>
                    <input
                      id="add-price-onetime"
                      type="number"
                      min="0"
                      step="any"
                      value={addPriceOnetime}
                      onChange={(e) => {
                        setAddPriceOnetime(e.target.value);
                        if (addErrors.price)
                          setAddErrors((prev) => ({
                            ...prev,
                            price: undefined,
                          }));
                      }}
                      placeholder="e.g. 1499"
                      data-ocid="products.add_modal.price_onetime_input"
                      style={{
                        width: "100%",
                        paddingLeft: "22px",
                        paddingRight: "8px",
                        paddingTop: "9px",
                        paddingBottom: "9px",
                        background: "rgba(17,19,34,0.8)",
                        border: addErrors.price
                          ? "1px solid #f87171"
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#EEF0F8",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(226,232,240,1)";
                      }}
                      onBlur={(e) => {
                        if (!addErrors.price)
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.1)";
                      }}
                    />
                  </div>
                </div>
              </div>
              {addErrors.price && (
                <span
                  data-ocid="products.add_modal.price.field_error"
                  style={{
                    color: "#f87171",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "block",
                    marginTop: "8px",
                  }}
                >
                  {addErrors.price}
                </span>
              )}
            </div>

            {/* Payment Type */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="add-payment-type"
                style={{
                  display: "block",
                  color: "#EEF0F8",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "7px",
                }}
              >
                Payment Type
              </label>
              <select
                id="add-payment-type"
                value={addPaymentType}
                onChange={(e) => setAddPaymentType(e.target.value)}
                data-ocid="products.add_modal.payment_type_select"
                style={{
                  width: "100%",
                  padding: "10px 32px 10px 12px",
                  background: "rgba(17,19,34,0.8)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#EEF0F8",
                  fontSize: "13px",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7D90' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <option value="one_time">One-time payment</option>
                <option value="monthly">Monthly subscription</option>
                <option value="quarterly">Quarterly subscription</option>
                <option value="annual">Annual subscription</option>
                <option value="deposit_50">50% deposit now / 50% later</option>
              </select>
            </div>

            {(addCategory === "SaaS Plans" ||
              (addCategory?.includes("SaaS") ?? false)) && (
              <div>
                <label
                  htmlFor="add-plan-section"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Plan Section
                </label>
                <select
                  value={addPlanSection}
                  onChange={(e) => setAddPlanSection(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  id="add-plan-section"
                >
                  <option value="">Auto (default)</option>
                  <option value="management">Management Plans</option>
                  <option value="hosting">Hosting Plans</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Controls which sub-section on the SaaS Plans page this plan
                  appears in.
                </p>
              </div>
            )}

            {(addCategory === "SaaS Plans" || addPlanSection === "hosting") && (
              <div>
                <label
                  htmlFor="speedy-filter-input"
                  className="block text-sm font-medium text-white/70 mb-1"
                >
                  Speedy Filter Tier
                </label>
                <input
                  id="speedy-filter-input"
                  type="text"
                  value={addSpeedyFilter}
                  onChange={(e) => setAddSpeedyFilter(e.target.value)}
                  placeholder="basic, booking, or storefront"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Sets which Speedy Sites widget filter opens for this hosting
                  plan.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="addVideoUrl1"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Video URL 1
              </label>
              <input
                id="addVideoUrl1"
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                value={addVideoUrl1}
                onChange={(e) => setAddVideoUrl1(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="addVideoUrl2"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Video URL 2
              </label>
              <input
                id="addVideoUrl2"
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                value={addVideoUrl2}
                onChange={(e) => setAddVideoUrl2(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="addShowQuestionnaire"
                checked={addShowQuestionnaire}
                onChange={(e) => setAddShowQuestionnaire(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500"
              />
              <label
                htmlFor="addShowQuestionnaire"
                className="text-sm font-medium text-gray-300"
              >
                Show questionnaire before checkout
              </label>
            </div>

            {/* Detail Page SEO & Content — collapsed by default */}
            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setAddSeoSectionOpen((prev) => !prev)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(30,30,50,0.8)",
                  border: "1px solid rgba(226,232,240,0.8)",
                  borderRadius: "8px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                }}
              >
                <span>Detail Page SEO &amp; Content</span>
                <svg
                  aria-hidden="true"
                  style={{
                    width: "18px",
                    height: "18px",
                    transform: addSeoSectionOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Toggle section</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {addSeoSectionOpen && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label
                      htmlFor="add-seo-meta-title"
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      SEO Meta Title
                    </label>
                    <input
                      id="add-seo-meta-title"
                      type="text"
                      value={addSeoMetaTitle}
                      onChange={(e) => setAddSeoMetaTitle(e.target.value)}
                      placeholder="55–60 characters recommended"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(226,232,240,0.8)",
                        borderRadius: "6px",
                        padding: "7px 10px",
                        color: "#e0e0e0",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="add-seo-meta-description"
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      SEO Meta Description
                    </label>
                    <textarea
                      id="add-seo-meta-description"
                      value={addSeoMetaDescription}
                      onChange={(e) => setAddSeoMetaDescription(e.target.value)}
                      rows={2}
                      placeholder="150–160 characters recommended"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(226,232,240,0.8)",
                        borderRadius: "6px",
                        padding: "7px 10px",
                        color: "#e0e0e0",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                        resize: "vertical",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="add-hero-headline"
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Hero Headline (H1)
                    </label>
                    <input
                      id="add-hero-headline"
                      type="text"
                      value={addHeroHeadline}
                      onChange={(e) => setAddHeroHeadline(e.target.value)}
                      placeholder="Benefit-driven, 6–12 words"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(226,232,240,0.8)",
                        borderRadius: "6px",
                        padding: "7px 10px",
                        color: "#e0e0e0",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="add-hero-subheadline"
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Hero Subheadline
                    </label>
                    <textarea
                      id="add-hero-subheadline"
                      value={addHeroSubheadline}
                      onChange={(e) => setAddHeroSubheadline(e.target.value)}
                      rows={2}
                      placeholder="1–2 supporting sentences"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(226,232,240,0.8)",
                        borderRadius: "6px",
                        padding: "7px 10px",
                        color: "#e0e0e0",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                        resize: "vertical",
                      }}
                    />
                  </div>
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: dynamic list label, no single input to associate */}
                    <label
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "6px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Body Sections
                    </label>
                    {addBodySectionsArr.map(
                      (section: BodySection, i: number) => (
                        <div
                          key={section.heading.slice(0, 20) || `sec-${i}`}
                          style={{
                            marginBottom: "10px",
                            padding: "10px",
                            background: "rgba(14,15,26,0.9)",
                            border: "1px solid rgba(226,232,240,0.6)",
                            borderRadius: "6px",
                            position: "relative",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setAddBodySectionsArr((prev) =>
                                prev.filter(
                                  (_: BodySection, idx: number) => idx !== i,
                                ),
                              )
                            }
                            style={{
                              position: "absolute",
                              top: "6px",
                              right: "8px",
                              color: "#888",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "16px",
                            }}
                          >
                            ×
                          </button>
                          <input
                            type="text"
                            value={section.heading}
                            placeholder="Heading"
                            onChange={(e) =>
                              setAddBodySectionsArr((prev) =>
                                prev.map((s: BodySection, idx: number) =>
                                  idx === i
                                    ? { ...s, heading: e.target.value }
                                    : s,
                                ),
                              )
                            }
                            style={{
                              width: "100%",
                              background: "rgba(0,0,0,0.5)",
                              border: "1px solid rgba(226,232,240,0.6)",
                              borderRadius: "4px",
                              padding: "5px 8px",
                              color: "#e0e0e0",
                              fontSize: "12px",
                              fontFamily: "Inter, sans-serif",
                              marginBottom: "6px",
                            }}
                          />
                          <textarea
                            value={section.body}
                            rows={2}
                            placeholder="Body text"
                            onChange={(e) =>
                              setAddBodySectionsArr((prev) =>
                                prev.map((s: BodySection, idx: number) =>
                                  idx === i
                                    ? { ...s, body: e.target.value }
                                    : s,
                                ),
                              )
                            }
                            style={{
                              width: "100%",
                              background: "rgba(0,0,0,0.5)",
                              border: "1px solid rgba(226,232,240,0.6)",
                              borderRadius: "4px",
                              padding: "5px 8px",
                              color: "#e0e0e0",
                              fontSize: "12px",
                              fontFamily: "Inter, sans-serif",
                              resize: "vertical",
                            }}
                          />
                        </div>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setAddBodySectionsArr((prev) => [
                          ...prev,
                          { heading: "", body: "" },
                        ])
                      }
                      style={{
                        color: "#22C55E",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      + Add Section
                    </button>
                  </div>
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: dynamic list label, no single input to associate */}
                    <label
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "6px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Proof Points
                    </label>
                    {addProofPointsArr.map((point: string, i: number) => (
                      <div
                        key={point.slice(0, 20) || `pt-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "6px",
                        }}
                      >
                        <input
                          type="text"
                          value={point}
                          onChange={(e) =>
                            setAddProofPointsArr((prev) =>
                              prev.map((v: string, idx: number) =>
                                idx === i ? e.target.value : v,
                              ),
                            )
                          }
                          style={{
                            flex: 1,
                            background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(226,232,240,0.8)",
                            borderRadius: "6px",
                            padding: "5px 8px",
                            color: "#e0e0e0",
                            fontSize: "12px",
                            fontFamily: "Inter, sans-serif",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setAddProofPointsArr((prev) =>
                              prev.filter(
                                (_: string, idx: number) => idx !== i,
                              ),
                            )
                          }
                          style={{
                            color: "#888",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setAddProofPointsArr((prev) => [...prev, ""])
                      }
                      style={{
                        color: "#22C55E",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      + Add Proof Point
                    </button>
                  </div>
                  <div>
                    {/* biome-ignore lint/a11y/noLabelWithoutControl: dynamic list label, no single input to associate */}
                    <label
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "6px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      FAQ Items
                    </label>
                    {addFaqItemsArr.map((item: FaqItem, i: number) => (
                      <div
                        key={item.question.slice(0, 20) || `fq-${i}`}
                        style={{
                          marginBottom: "10px",
                          padding: "10px",
                          background: "rgba(14,15,26,0.9)",
                          border: "1px solid rgba(226,232,240,0.6)",
                          borderRadius: "6px",
                          position: "relative",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setAddFaqItemsArr((prev) =>
                              prev.filter(
                                (_: FaqItem, idx: number) => idx !== i,
                              ),
                            )
                          }
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "8px",
                            color: "#888",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          ×
                        </button>
                        <input
                          type="text"
                          value={item.question}
                          placeholder="Question"
                          onChange={(e) =>
                            setAddFaqItemsArr((prev) =>
                              prev.map((f: FaqItem, idx: number) =>
                                idx === i
                                  ? { ...f, question: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.5)",
                            border: "1px solid rgba(226,232,240,0.6)",
                            borderRadius: "4px",
                            padding: "5px 8px",
                            color: "#e0e0e0",
                            fontSize: "12px",
                            fontFamily: "Inter, sans-serif",
                            marginBottom: "6px",
                          }}
                        />
                        <textarea
                          value={item.answer}
                          rows={2}
                          placeholder="Answer"
                          onChange={(e) =>
                            setAddFaqItemsArr((prev) =>
                              prev.map((f: FaqItem, idx: number) =>
                                idx === i
                                  ? { ...f, answer: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          style={{
                            width: "100%",
                            background: "rgba(0,0,0,0.5)",
                            border: "1px solid rgba(226,232,240,0.6)",
                            borderRadius: "4px",
                            padding: "5px 8px",
                            color: "#e0e0e0",
                            fontSize: "12px",
                            fontFamily: "Inter, sans-serif",
                            resize: "vertical",
                          }}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setAddFaqItemsArr((prev) => [
                          ...prev,
                          { question: "", answer: "" },
                        ])
                      }
                      style={{
                        color: "#22C55E",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      + Add FAQ
                    </button>
                  </div>
                  <div>
                    <label
                      htmlFor="add-closing-cta"
                      style={{
                        display: "block",
                        color: "#ccc",
                        fontSize: "12px",
                        marginBottom: "4px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Closing CTA
                    </label>
                    <input
                      id="add-closing-cta"
                      type="text"
                      value={addClosingCTA}
                      onChange={(e) => setAddClosingCTA(e.target.value)}
                      placeholder="Short urgent line above the checkout button"
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(226,232,240,0.8)",
                        borderRadius: "6px",
                        padding: "7px 10px",
                        color: "#e0e0e0",
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Modal footer actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "28px",
                paddingTop: "20px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <button
                type="button"
                data-ocid="products.add_modal.cancel_button"
                onClick={handleCloseAddModal}
                disabled={isAdding}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(226,232,240,0.8)",
                  borderRadius: "8px",
                  color: "#22C55E",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "10px 20px",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EEF0F8";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#7A7D90";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="products.add_modal.submit_button"
                onClick={handleAddSave}
                disabled={isAdding}
                style={{
                  background: isAdding ? "rgba(94,240,138,0.5)" : "#22C55E",
                  border: "none",
                  borderRadius: "8px",
                  color: "#0A0B14",
                  fontSize: "13px",
                  fontWeight: 700,
                  padding: "10px 24px",
                  cursor: isAdding ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isAdding) e.currentTarget.style.background = "#4ade80";
                }}
                onMouseLeave={(e) => {
                  if (!isAdding) e.currentTarget.style.background = "#22C55E";
                }}
              >
                {isAdding ? (
                  <>
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(10,11,20,0.3)",
                        borderTop: "2px solid #0A0B14",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite",
                        flexShrink: 0,
                      }}
                    />
                    Saving…
                  </>
                ) : (
                  "Save Service"
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}

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
            <TypewriterText className="matrix-heading" text="Product Catalog" />
          </h1>
          {/* Add New button — always in the header row */}
          <button
            type="button"
            data-ocid="products.add_new_button"
            onClick={handleOpenAddModal}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "#22C55E",
              border: "none",
              borderRadius: "9px",
              color: "#0A0B14",
              fontSize: "13px",
              fontWeight: 700,
              padding: "9px 18px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4ade80";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#22C55E";
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Add New
          </button>

          {!loading && !error && (
            <>
              <span
                data-ocid="products.total_badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "rgba(94,240,138,0.12)",
                  border: "1px solid rgba(94,240,138,0.25)",
                  color: "#22C55E",
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
                <CheckCircle size={13} color="#22C55E" />
                <span style={{ color: "#22C55E" }}>Stripe: Connected</span>
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
              borderTop: "2px solid #22C55E",
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
                e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
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
              e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <option value="">All Categories</option>
            {[...new Set(products.map((p: Product) => p.product_type))]
              .sort()
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>

          {/* Payment type dropdown */}
          <select
            value={paymentTypeFilter}
            onChange={(e) => handleSetPaymentTypeFilter(e.target.value)}
            data-ocid="products.payment_type_filter"
            aria-label="Filter by payment type"
            style={{
              flex: "0 1 200px",
              minWidth: "160px",
              padding: "9px 32px 9px 12px",
              background: "rgba(17,19,34,0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: paymentTypeFilter ? "#EEF0F8" : "#7A7D90",
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
              e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <option value="">All types</option>
            <option value="one_time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="deposit_50">50% Deposit</option>
          </select>

          {/* Refresh button — always visible in the normal toolbar */}
          <button
            type="button"
            data-ocid="products.refresh_button"
            onClick={fetchProducts}
            aria-label="Refresh product catalog"
            style={{
              background: "transparent",
              border: "1px solid rgba(226,232,240,0.8)",
              borderRadius: "8px",
              color: "#22C55E",
              fontSize: "12px",
              fontWeight: 600,
              padding: "9px 14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.15s, border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(94,240,138,0.08)";
              e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(226,232,240,0.8)";
            }}
          >
            <RefreshCw size={13} strokeWidth={2.5} />
            Refresh
          </button>

          {/* Active filter indicator */}
          {(searchQuery || categoryFilter || paymentTypeFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("");
                handleSetPaymentTypeFilter("");
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "#ccc", fontWeight: 600 }}>
              {selectedIds.size} product{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
            {!bulkConfirming && (
              <select
                value=""
                onChange={(e) => handleBulkTypeSelect(e.target.value)}
                style={{
                  background: "#0d0d1a",
                  color: "#fff",
                  border: "1px solid #555",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 13,
                }}
              >
                <option value="">Change payment type...</option>
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="deposit_50">50% Deposit</option>
              </select>
            )}
          </div>
          {bulkConfirming && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={{ color: "#e0e0e0", fontSize: 14 }}>
                Change payment type for {selectedIds.size} product
                {selectedIds.size !== 1 ? "s" : ""} to{" "}
                <strong>{bulkLabelMap[bulkTargetType]}</strong>?
              </span>
              <button
                type="button"
                onClick={handleBulkConfirm}
                disabled={bulkSaving}
                style={{
                  background: "#4ade80",
                  color: "#000",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 14px",
                  fontWeight: 700,
                  cursor: bulkSaving ? "not-allowed" : "pointer",
                }}
              >
                {bulkSaving ? "Saving..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={handleBulkCancel}
                disabled={bulkSaving}
                style={{
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
          {bulkError && (
            <span style={{ color: "#f87171", fontSize: 13 }}>{bulkError}</span>
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
              {searchQuery || categoryFilter || paymentTypeFilter
                ? "No products found for the selected filters."
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
                  editDescription={editDescription}
                  onEditDescriptionChange={setEditDescription}
                  editTagline={editTagline}
                  onEditTaglineChange={setEditTagline}
                  editFeatureBullets={editFeatureBullets}
                  onEditFeatureBulletsChange={setEditFeatureBullets}
                  editBestFor={editBestFor}
                  onEditBestForChange={setEditBestFor}
                  editUpgradePath={editUpgradePath}
                  onEditUpgradePathChange={setEditUpgradePath}
                  editRecommendedPlan={editRecommendedPlan}
                  onEditRecommendedPlanChange={setEditRecommendedPlan}
                  editPriceMonthly={editPriceMonthly}
                  editPriceAnnual={editPriceAnnual}
                  editPriceOnetime={editPriceOnetime}
                  onEditPriceMonthlyChange={setEditPriceMonthly}
                  onEditPriceAnnualChange={setEditPriceAnnual}
                  onEditPriceOnetimeChange={setEditPriceOnetime}
                  editImageUrl={editImageUrl}
                  onEditImageUrlChange={setEditImageUrl}
                  imageUploading={imageUploading}
                  onImageUpload={async (file) => {
                    setImageUploading(true);
                    const url = await uploadProductImage(file);
                    setEditImageUrl(url);
                    setImageUploading(false);
                  }}
                  priceError={priceError}
                  isSaving={isSaving}
                  saveSuccessId={saveSuccess}
                  onEditStart={handleEditStart}
                  onEditCancel={handleEditCancel}
                  onEditSave={handleEditSave}
                  onToggle={handleToggle}
                  isCategoryVisible={isCatVisible}
                  isCategoryToggling={isCatToggling}
                  onCategoryToggle={handleCategoryToggle}
                  portalShopIds={portalShopIds}
                  portalShopTogglingSet={portalShopTogglingSet}
                  onPortalShopToggle={handlePortalShopToggle}
                  onRemoveImage={handleRemoveImage}
                  editPaymentType={editPaymentType}
                  onEditPaymentTypeChange={setEditPaymentType}
                  editPlanSection={editPlanSection}
                  onEditPlanSectionChange={setEditPlanSection}
                  editSpeedyFilter={editSpeedyFilter}
                  onEditSpeedyFilterChange={setEditSpeedyFilter}
                  selectedIds={selectedIds}
                  onRowSelect={handleRowSelect}
                  onSelectAll={handleSelectAll}
                  visibleProductIds={visibleProductIds}
                  editVideoUrl1={editVideoUrl1}
                  editVideoUrl2={editVideoUrl2}
                  editShowQuestionnaire={editShowQuestionnaire}
                  onEditVideoUrl1Change={setEditVideoUrl1}
                  onEditVideoUrl2Change={setEditVideoUrl2}
                  onEditShowQuestionnaireChange={setEditShowQuestionnaire}
                  editDetailDescription={editDetailDescription}
                  onEditDetailDescriptionChange={setEditDetailDescription}
                  editSeoMetaTitle={editSeoMetaTitle}
                  onEditSeoMetaTitleChange={setEditSeoMetaTitle}
                  editSeoMetaDescription={editSeoMetaDescription}
                  onEditSeoMetaDescriptionChange={setEditSeoMetaDescription}
                  editHeroHeadline={editHeroHeadline}
                  onEditHeroHeadlineChange={setEditHeroHeadline}
                  editHeroSubheadline={editHeroSubheadline}
                  onEditHeroSubheadlineChange={setEditHeroSubheadline}
                  editClosingCTA={editClosingCTA}
                  onEditClosingCTAChange={setEditClosingCTA}
                  editBodySectionsArr={editBodySectionsArr}
                  onEditBodySectionsArrChange={setEditBodySectionsArr}
                  editProofPointsArr={editProofPointsArr}
                  onEditProofPointsArrChange={setEditProofPointsArr}
                  editFaqItemsArr={editFaqItemsArr}
                  onEditFaqItemsArrChange={setEditFaqItemsArr}
                  editSeoSectionOpen={editSeoSectionOpen}
                  onEditSeoSectionOpenChange={setEditSeoSectionOpen}
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
          border: 1px solid rgba(226,232,240,0.8);
          color: #22C55E;
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
          border-color: rgba(226,232,240,1);
        }
        .save-btn {
          background: #22C55E;
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
        .price-input:focus { border-color: #22C55E; }
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
          background: #22C55E;
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
  editDescription: string;
  onEditDescriptionChange: (val: string) => void;
  priceError: string | null;
  isSaving: boolean;
  saveSuccessId: string | null;
  onEditStart: (product: Product) => void;
  onEditCancel: () => void;
  onEditSave: (product: Product) => void;
  onToggle: (productId: string, currentActive: boolean) => Promise<void>;
  isCategoryVisible: boolean;
  isCategoryToggling: boolean;
  onCategoryToggle: (category: string, currentVisible: boolean) => void;
  portalShopIds: Set<string>;
  portalShopTogglingSet: Set<string>;
  onPortalShopToggle: (productId: string) => Promise<void>;
  editTagline: string;
  onEditTaglineChange: (v: string) => void;
  editFeatureBullets: string;
  onEditFeatureBulletsChange: (v: string) => void;
  editBestFor: string;
  onEditBestForChange: (v: string) => void;
  editUpgradePath: string;
  onEditUpgradePathChange: (v: string) => void;
  editRecommendedPlan: string;
  onEditRecommendedPlanChange: (v: string) => void;
  editPriceMonthly: string;
  editPriceAnnual: string;
  editPriceOnetime: string;
  onEditPriceMonthlyChange: (v: string) => void;
  onEditPriceAnnualChange: (v: string) => void;
  onEditPriceOnetimeChange: (v: string) => void;
  editImageUrl: string;
  onEditImageUrlChange: (url: string) => void;
  imageUploading: boolean;
  onImageUpload: (file: File) => Promise<void>;
  onRemoveImage?: (productId: string) => Promise<void>;
  editPaymentType: string;
  onEditPaymentTypeChange: (v: string) => void;
  selectedIds: Set<string>;
  editPlanSection: string;
  onEditPlanSectionChange: (val: string) => void;
  editSpeedyFilter: string;
  onEditSpeedyFilterChange: (val: string) => void;
  onRowSelect: (id: string) => void;
  onSelectAll: () => void;
  visibleProductIds: Set<string>;
  editVideoUrl1: string;
  editVideoUrl2: string;
  editShowQuestionnaire: boolean;
  onEditVideoUrl1Change: (v: string) => void;
  onEditVideoUrl2Change: (v: string) => void;
  onEditShowQuestionnaireChange: (v: boolean) => void;
  editDetailDescription: string;
  onEditDetailDescriptionChange: (v: string) => void;
  editSeoMetaTitle: string;
  onEditSeoMetaTitleChange: (v: string) => void;
  editSeoMetaDescription: string;
  onEditSeoMetaDescriptionChange: (v: string) => void;
  editHeroHeadline: string;
  onEditHeroHeadlineChange: (v: string) => void;
  editHeroSubheadline: string;
  onEditHeroSubheadlineChange: (v: string) => void;
  editClosingCTA: string;
  onEditClosingCTAChange: (v: string) => void;
  editBodySectionsArr: BodySection[];
  onEditBodySectionsArrChange: (v: BodySection[]) => void;
  editProofPointsArr: string[];
  onEditProofPointsArrChange: (v: string[]) => void;
  editFaqItemsArr: FaqItem[];
  onEditFaqItemsArrChange: (v: FaqItem[]) => void;
  editSeoSectionOpen: boolean;
  onEditSeoSectionOpenChange: (v: boolean) => void;
}

function CategorySection({
  category,
  products,
  editingId,
  editDescription,
  onEditDescriptionChange,
  priceError,
  isSaving,
  saveSuccessId,
  onEditStart,
  onEditCancel,
  onEditSave,
  onToggle,
  isCategoryVisible,
  isCategoryToggling,
  onCategoryToggle,
  portalShopIds,
  portalShopTogglingSet,
  onPortalShopToggle,
  editTagline,
  onEditTaglineChange,
  editFeatureBullets,
  onEditFeatureBulletsChange,
  editBestFor,
  onEditBestForChange,
  editUpgradePath,
  onEditUpgradePathChange,
  editRecommendedPlan,
  onEditRecommendedPlanChange,
  editPriceMonthly,
  editPriceAnnual,
  editPriceOnetime,
  onEditPriceMonthlyChange,
  onEditPriceAnnualChange,
  onEditPriceOnetimeChange,
  editImageUrl,
  onEditImageUrlChange,
  imageUploading,
  onImageUpload,
  onRemoveImage,
  editPaymentType,
  onEditPaymentTypeChange,
  selectedIds,
  editPlanSection,
  onEditPlanSectionChange,
  editSpeedyFilter,
  onEditSpeedyFilterChange,
  onRowSelect,
  onSelectAll,
  visibleProductIds,
  editVideoUrl1,
  editVideoUrl2,
  editShowQuestionnaire,
  onEditVideoUrl1Change,
  onEditVideoUrl2Change,
  onEditShowQuestionnaireChange,
  editDetailDescription,
  onEditDetailDescriptionChange,
  editSeoMetaTitle,
  onEditSeoMetaTitleChange,
  editSeoMetaDescription,
  onEditSeoMetaDescriptionChange,
  editHeroHeadline,
  onEditHeroHeadlineChange,
  editHeroSubheadline,
  onEditHeroSubheadlineChange,
  editClosingCTA,
  onEditClosingCTAChange,
  editBodySectionsArr,
  onEditBodySectionsArrChange,
  editProofPointsArr,
  onEditProofPointsArrChange,
  editFaqItemsArr,
  onEditFaqItemsArrChange,
  editSeoSectionOpen,
  onEditSeoSectionOpenChange,
}: CategorySectionProps) {
  void onEditImageUrlChange;
  void onSelectAll;
  const visibleInCategory = products
    .map((p) => String(p.id))
    .filter((id) => visibleProductIds.has(id));
  const allCategorySelected =
    visibleInCategory.length > 0 &&
    visibleInCategory.every((id) => selectedIds.has(id));
  const someCategorySelected = visibleInCategory.some((id) =>
    selectedIds.has(id),
  );
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
        <input
          type="checkbox"
          aria-label={`Select all ${category} products`}
          checked={allCategorySelected}
          ref={(el) => {
            if (el)
              el.indeterminate = someCategorySelected && !allCategorySelected;
          }}
          onChange={() => {
            for (const id of visibleInCategory) {
              const shouldSelect = !allCategorySelected;
              const isCurrentlySelected = selectedIds.has(id);
              if (shouldSelect !== isCurrentlySelected) onRowSelect(id);
            }
          }}
          style={{
            width: 15,
            height: 15,
            cursor: "pointer",
            flexShrink: 0,
            accentColor: "#22C55E",
          }}
        />
        <h2
          style={{
            color: isCategoryVisible ? "#22C55E" : "#7A7D90",
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
              color: isCategoryVisible ? "#22C55E" : "#7A7D90",
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
            color: isCategoryVisible ? "#22C55E" : "#7A7D90",
            border: isCategoryVisible
              ? "1px solid rgba(226,232,240,0.6)"
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
            isSelected={selectedIds.has(String(product.id))}
            onSelect={onRowSelect}
            editDescription={editDescription}
            onEditDescriptionChange={onEditDescriptionChange}
            priceError={priceError}
            isSaving={isSaving}
            wasSaved={saveSuccessId === String(product.id)}
            onEditStart={onEditStart}
            onEditCancel={onEditCancel}
            onEditSave={onEditSave}
            onToggle={onToggle}
            isInPortalShop={portalShopIds.has(String(product.id))}
            isPortalShopToggling={portalShopTogglingSet.has(String(product.id))}
            onPortalShopToggle={onPortalShopToggle}
            editTagline={editTagline}
            onEditTaglineChange={onEditTaglineChange}
            editFeatureBullets={editFeatureBullets}
            onEditFeatureBulletsChange={onEditFeatureBulletsChange}
            editBestFor={editBestFor}
            onEditBestForChange={onEditBestForChange}
            editUpgradePath={editUpgradePath}
            onEditUpgradePathChange={onEditUpgradePathChange}
            editRecommendedPlan={editRecommendedPlan}
            onEditRecommendedPlanChange={onEditRecommendedPlanChange}
            editPriceMonthly={editPriceMonthly}
            editPriceAnnual={editPriceAnnual}
            editPriceOnetime={editPriceOnetime}
            onEditPriceMonthlyChange={onEditPriceMonthlyChange}
            onEditPriceAnnualChange={onEditPriceAnnualChange}
            onEditPriceOnetimeChange={onEditPriceOnetimeChange}
            editImageUrl={editImageUrl}
            imageUploading={imageUploading}
            onImageUpload={onImageUpload}
            onRemoveImage={onRemoveImage}
            editPaymentType={editPaymentType}
            onEditPaymentTypeChange={onEditPaymentTypeChange}
            editVideoUrl1={editVideoUrl1}
            editPlanSection={editPlanSection}
            onEditPlanSectionChange={onEditPlanSectionChange}
            editSpeedyFilter={editSpeedyFilter}
            onEditSpeedyFilterChange={onEditSpeedyFilterChange}
            editVideoUrl2={editVideoUrl2}
            editShowQuestionnaire={editShowQuestionnaire}
            onEditVideoUrl1Change={onEditVideoUrl1Change}
            onEditVideoUrl2Change={onEditVideoUrl2Change}
            onEditShowQuestionnaireChange={onEditShowQuestionnaireChange}
            editDetailDescription={editDetailDescription}
            onEditDetailDescriptionChange={onEditDetailDescriptionChange}
            editSeoMetaTitle={editSeoMetaTitle}
            onEditSeoMetaTitleChange={onEditSeoMetaTitleChange}
            editSeoMetaDescription={editSeoMetaDescription}
            onEditSeoMetaDescriptionChange={onEditSeoMetaDescriptionChange}
            editHeroHeadline={editHeroHeadline}
            onEditHeroHeadlineChange={onEditHeroHeadlineChange}
            editHeroSubheadline={editHeroSubheadline}
            onEditHeroSubheadlineChange={onEditHeroSubheadlineChange}
            editClosingCTA={editClosingCTA}
            onEditClosingCTAChange={onEditClosingCTAChange}
            editBodySectionsArr={editBodySectionsArr}
            onEditBodySectionsArrChange={onEditBodySectionsArrChange}
            editProofPointsArr={editProofPointsArr}
            onEditProofPointsArrChange={onEditProofPointsArrChange}
            editFaqItemsArr={editFaqItemsArr}
            onEditFaqItemsArrChange={onEditFaqItemsArrChange}
            editSeoSectionOpen={editSeoSectionOpen}
            onEditSeoSectionOpenChange={onEditSeoSectionOpenChange}
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
  editDescription: string;
  onEditDescriptionChange: (val: string) => void;
  priceError: string | null;
  isSaving: boolean;
  wasSaved: boolean;
  onEditStart: (product: Product) => void;
  onEditCancel: () => void;
  onEditSave: (product: Product) => void;
  onToggle: (productId: string, currentActive: boolean) => Promise<void>;
  isInPortalShop: boolean;
  isPortalShopToggling: boolean;
  onPortalShopToggle: (productId: string) => Promise<void>;
  editTagline: string;
  onEditTaglineChange: (v: string) => void;
  editFeatureBullets: string;
  onEditFeatureBulletsChange: (v: string) => void;
  editBestFor: string;
  onEditBestForChange: (v: string) => void;
  editUpgradePath: string;
  onEditUpgradePathChange: (v: string) => void;
  editRecommendedPlan: string;
  onEditRecommendedPlanChange: (v: string) => void;
  editPriceMonthly: string;
  editPriceAnnual: string;
  editPriceOnetime: string;
  onEditPriceMonthlyChange: (v: string) => void;
  onEditPriceAnnualChange: (v: string) => void;
  onEditPriceOnetimeChange: (v: string) => void;
  editImageUrl: string;
  imageUploading: boolean;
  onImageUpload: (file: File) => Promise<void>;
  onRemoveImage?: (productId: string) => Promise<void>;
  editPaymentType: string;
  onEditPaymentTypeChange: (v: string) => void;
  isSelected: boolean;
  editPlanSection: string;
  onEditPlanSectionChange: (val: string) => void;
  editSpeedyFilter: string;
  onEditSpeedyFilterChange: (val: string) => void;
  onSelect: (id: string) => void;
  editVideoUrl1: string;
  editVideoUrl2: string;
  editShowQuestionnaire: boolean;
  onEditVideoUrl1Change: (v: string) => void;
  onEditVideoUrl2Change: (v: string) => void;
  onEditShowQuestionnaireChange: (v: boolean) => void;
  editDetailDescription: string;
  onEditDetailDescriptionChange: (v: string) => void;
  editSeoMetaTitle: string;
  onEditSeoMetaTitleChange: (v: string) => void;
  editSeoMetaDescription: string;
  onEditSeoMetaDescriptionChange: (v: string) => void;
  editHeroHeadline: string;
  onEditHeroHeadlineChange: (v: string) => void;
  editHeroSubheadline: string;
  onEditHeroSubheadlineChange: (v: string) => void;
  editClosingCTA: string;
  onEditClosingCTAChange: (v: string) => void;
  editBodySectionsArr: BodySection[];
  onEditBodySectionsArrChange: (v: BodySection[]) => void;
  editProofPointsArr: string[];
  onEditProofPointsArrChange: (v: string[]) => void;
  editFaqItemsArr: FaqItem[];
  onEditFaqItemsArrChange: (v: FaqItem[]) => void;
  editSeoSectionOpen: boolean;
  onEditSeoSectionOpenChange: (v: boolean) => void;
}

function ProductRow({
  product,
  isLast,
  isEditing,
  editDescription,
  onEditDescriptionChange,
  priceError,
  isSaving,
  wasSaved,
  onEditStart,
  onEditCancel,
  onEditSave,
  onToggle,
  isInPortalShop,
  isPortalShopToggling,
  onPortalShopToggle,
  editTagline,
  onEditTaglineChange,
  editFeatureBullets,
  onEditFeatureBulletsChange,
  editBestFor,
  onEditBestForChange,
  editUpgradePath,
  onEditUpgradePathChange,
  editRecommendedPlan,
  onEditRecommendedPlanChange,
  editPriceMonthly,
  editPriceAnnual,
  editPriceOnetime,
  onEditPriceMonthlyChange,
  onEditPriceAnnualChange,
  onEditPriceOnetimeChange,
  editImageUrl,
  imageUploading,
  onImageUpload,
  onRemoveImage,
  editPaymentType,
  onEditPaymentTypeChange,
  isSelected,
  editPlanSection,
  onEditPlanSectionChange,
  editSpeedyFilter,
  onEditSpeedyFilterChange,
  onSelect,
  editVideoUrl1,
  editVideoUrl2,
  editShowQuestionnaire,
  onEditVideoUrl1Change,
  onEditVideoUrl2Change,
  onEditShowQuestionnaireChange,
  editDetailDescription,
  onEditDetailDescriptionChange,
  editSeoMetaTitle,
  onEditSeoMetaTitleChange,
  editSeoMetaDescription,
  onEditSeoMetaDescriptionChange,
  editHeroHeadline,
  onEditHeroHeadlineChange,
  editHeroSubheadline,
  onEditHeroSubheadlineChange,
  editClosingCTA,
  onEditClosingCTAChange,
  editBodySectionsArr,
  onEditBodySectionsArrChange,
  editProofPointsArr,
  onEditProofPointsArrChange,
  editFaqItemsArr,
  onEditFaqItemsArrChange,
  editSeoSectionOpen,
  onEditSeoSectionOpenChange,
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
  const _suffix = type === "monthly" ? "/mo" : type === "annual" ? "/yr" : "";

  const handleSave = async () => {
    await onEditSave(product);
  };

  const _handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
        gridTemplateColumns: "auto 1fr auto",
        gap: "16px",
        padding: "16px 24px",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.15s, opacity 0.2s",
        background: isSelected
          ? "rgba(94,240,138,0.05)"
          : hovered
            ? "rgba(94,240,138,0.03)"
            : "transparent",
        alignItems: isEditing ? "flex-start" : "center",
        opacity: isActive ? 1 : 0.45,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input
        type="checkbox"
        aria-label={`Select ${product.name}`}
        checked={isSelected}
        onChange={() => onSelect(String(product.id))}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 15,
          height: 15,
          cursor: "pointer",
          flexShrink: 0,
          marginTop: isEditing ? 4 : 0,
          accentColor: "#22C55E",
        }}
      />
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
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              style={{
                width: "40px",
                height: "40px",
                objectFit: "cover",
                borderRadius: "6px",
                flexShrink: 0,
                border: "1px solid rgba(94,240,138,0.15)",
              }}
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "6px",
                flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          )}
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
          <PaymentTypeBadge paymentType={product.payment_type ?? "one_time"} />
          {isSetupFeeProduct(product) && <SetupFeeBadge />}
          {product.product_type && (
            <span
              style={{
                display: "inline-block",
                background: "rgba(94,240,138,0.08)",
                color: "#22C55E",
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
          alignItems: isEditing ? "flex-start" : "center",
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
                gap: "8px",
              }}
            >
              {/* Price rows */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                }}
              >
                <div className="mb-3">
                  <label
                    htmlFor="edit-price-monthly"
                    className="block text-xs font-medium text-gray-400 mb-1"
                  >
                    Monthly Price ($)
                  </label>
                  <input
                    id="edit-price-monthly"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPriceMonthly}
                    onChange={(e) => onEditPriceMonthlyChange(e.target.value)}
                    placeholder="Leave blank to remove"
                    className={`price-input${priceError ? " price-input-error" : ""}`}
                  />
                </div>
                <div className="mb-3">
                  <label
                    htmlFor="edit-price-annual"
                    className="block text-xs font-medium text-gray-400 mb-1"
                  >
                    Annual Price ($)
                  </label>
                  <input
                    id="edit-price-annual"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPriceAnnual}
                    onChange={(e) => onEditPriceAnnualChange(e.target.value)}
                    placeholder="Leave blank to remove"
                    className={`price-input${priceError ? " price-input-error" : ""}`}
                  />
                </div>
                <div className="mb-3">
                  <label
                    htmlFor="edit-price-onetime"
                    className="block text-xs font-medium text-gray-400 mb-1"
                  >
                    One-Time Price ($)
                  </label>
                  <input
                    id="edit-price-onetime"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPriceOnetime}
                    onChange={(e) => onEditPriceOnetimeChange(e.target.value)}
                    placeholder="Leave blank to remove"
                    className={`price-input${priceError ? " price-input-error" : ""}`}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
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
              {/* Description textarea */}
              <div style={{ width: "100%" }}>
                <label
                  htmlFor={`edit-description-${String(product.id)}`}
                  style={{
                    display: "block",
                    color: "#EEF0F8",
                    fontSize: "11px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    textAlign: "left",
                  }}
                >
                  Description{" "}
                  <span
                    style={{
                      color: "#7A7D90",
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <textarea
                  id={`edit-description-${String(product.id)}`}
                  value={editDescription}
                  onChange={(e) => onEditDescriptionChange(e.target.value)}
                  placeholder="Short description of the service…"
                  rows={3}
                  data-ocid={`products.description_textarea.${String(product.id)}`}
                  style={{
                    width: "260px",
                    padding: "10px 12px",
                    background: "rgba(17,19,34,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#EEF0F8",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(226,232,240,1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-detail-description"
                  style={{
                    display: "block",
                    color: "#e0e0e0",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  Detail Page Description
                  <span
                    style={{
                      display: "block",
                      color: "#888",
                      fontSize: "11px",
                      marginTop: "2px",
                      fontWeight: "normal",
                    }}
                  >
                    Shown on the full product detail page. If left blank, the
                    card description above will be used.
                  </span>
                </label>
                <textarea
                  id="edit-detail-description"
                  value={editDetailDescription}
                  onChange={(e) =>
                    onEditDetailDescriptionChange(e.target.value)
                  }
                  rows={4}
                  placeholder="Long-form description for the product detail page..."
                  style={{
                    width: "100%",
                    background: "rgba(17,19,34,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "#e0e0e0",
                    fontSize: "13px",
                    resize: "vertical",
                    minHeight: "80px",
                  }}
                />
              </div>
              {/* Product Image Upload */}
              <div className="mb-3">
                <label
                  htmlFor={`edit-product-image-${String(product.id)}`}
                  className="block text-xs font-medium text-gray-400 mb-1"
                >
                  Product Image
                </label>
                <input
                  id={`edit-product-image-${String(product.id)}`}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      await onImageUpload(e.target.files[0]);
                    }
                  }}
                  className="block w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
                />
                {imageUploading && (
                  <span className="text-xs text-gray-400 mt-1 block">
                    Uploading...
                  </span>
                )}
                {editImageUrl && (
                  <div className="mt-2">
                    <img
                      src={editImageUrl}
                      alt="Product preview"
                      className="w-full h-32 object-cover rounded border border-green-500/30"
                    />
                    {onRemoveImage && (
                      <button
                        type="button"
                        onClick={() => onRemoveImage(String(product.id))}
                        className="text-xs text-red-400 hover:text-red-300 underline mt-1 block"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* Edit Tagline */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#B0B3C6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  Tagline
                </div>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => onEditTaglineChange(e.target.value)}
                  placeholder="Short one-liner…"
                  style={{
                    width: "100%",
                    background: "#0E0F1A",
                    border: "1px solid #2E3150",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#EEF0F8",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
              {/* Edit Feature Bullets */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#B0B3C6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  Feature Bullets (one per line)
                </div>
                <textarea
                  value={editFeatureBullets}
                  onChange={(e) => onEditFeatureBulletsChange(e.target.value)}
                  rows={4}
                  placeholder="Each line becomes a bullet…"
                  style={{
                    width: "100%",
                    background: "#0E0F1A",
                    border: "1px solid #2E3150",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#EEF0F8",
                    fontSize: "0.85rem",
                    resize: "vertical",
                  }}
                />
              </div>
              {/* Edit Best For */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#B0B3C6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  Best For
                </div>
                <input
                  type="text"
                  value={editBestFor}
                  onChange={(e) => onEditBestForChange(e.target.value)}
                  placeholder="Who is this for?"
                  style={{
                    width: "100%",
                    background: "#0E0F1A",
                    border: "1px solid #2E3150",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#EEF0F8",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
              {/* Edit Upgrade Path */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#B0B3C6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  Upgrade Path
                </div>
                <input
                  type="text"
                  value={editUpgradePath}
                  onChange={(e) => onEditUpgradePathChange(e.target.value)}
                  placeholder="e.g. Upgrade to Pro…"
                  style={{
                    width: "100%",
                    background: "#0E0F1A",
                    border: "1px solid #2E3150",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#EEF0F8",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
              {/* Edit Recommended Plan */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#B0B3C6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  Recommended Plan
                </div>
                <input
                  type="text"
                  value={editRecommendedPlan}
                  onChange={(e) => onEditRecommendedPlanChange(e.target.value)}
                  placeholder="e.g. Growth Hub Pro"
                  style={{
                    width: "100%",
                    background: "#0E0F1A",
                    border: "1px solid #2E3150",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#EEF0F8",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
              {/* Edit Payment Type */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#B0B3C6",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  Payment Type
                </div>
                <select
                  value={editPaymentType}
                  onChange={(e) => onEditPaymentTypeChange(e.target.value)}
                  data-ocid={`products.payment_type_select.${String(product.id)}`}
                  style={{
                    width: "100%",
                    background: "#0E0F1A",
                    border: "1px solid #2E3150",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    color: "#EEF0F8",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="one_time">One-time payment</option>
                  <option value="monthly">Monthly subscription</option>
                  <option value="quarterly">Quarterly subscription</option>
                  <option value="annual">Annual subscription</option>
                  <option value="deposit_50">
                    50% deposit now / 50% later
                  </option>
                </select>
              </div>

              {(product.product_type === "SaaS Plans" ||
                (product.product_type?.includes("SaaS") ?? false)) && (
                <div className="col-span-2">
                  <label
                    htmlFor="edit-plan-section"
                    className="block text-xs text-gray-400 mb-1"
                  >
                    Plan Section
                  </label>
                  <select
                    value={editPlanSection}
                    onChange={(e) => onEditPlanSectionChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                    id="edit-plan-section"
                  >
                    <option value="">Auto (default)</option>
                    <option value="management">Management Plans</option>
                    <option value="hosting">Hosting Plans</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Controls which sub-section on the SaaS Plans page this plan
                    appears in.
                  </p>
                </div>
              )}

              {(product.product_type === "SaaS Plans" ||
                editPlanSection === "hosting") && (
                <div className="col-span-2">
                  <label
                    htmlFor="edit-speedy-filter-input"
                    className="block text-sm font-medium text-white/70 mb-1"
                  >
                    Speedy Filter Tier
                  </label>
                  <input
                    id="edit-speedy-filter-input"
                    type="text"
                    value={editSpeedyFilter}
                    onChange={(e) => onEditSpeedyFilterChange(e.target.value)}
                    placeholder="basic, booking, or storefront"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sets which Speedy Sites widget filter opens for this hosting
                    plan.
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="editVideoUrl1"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Video URL 1
                </label>
                <input
                  id="editVideoUrl1"
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  value={editVideoUrl1}
                  onChange={(e) => onEditVideoUrl1Change(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="editVideoUrl2"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Video URL 2
                </label>
                <input
                  id="editVideoUrl2"
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  value={editVideoUrl2}
                  onChange={(e) => onEditVideoUrl2Change(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="editShowQuestionnaire"
                  checked={editShowQuestionnaire}
                  onChange={(e) =>
                    onEditShowQuestionnaireChange(e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500"
                />
                <label
                  htmlFor="editShowQuestionnaire"
                  className="text-sm font-medium text-gray-300"
                >
                  Show questionnaire before checkout
                </label>
              </div>

              {/* Detail Page SEO & Content — collapsed by default */}
              <div style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() =>
                    onEditSeoSectionOpenChange(!editSeoSectionOpen)
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "rgba(25,26,45,0.9)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#e0e0e0",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <span>Detail Page SEO &amp; Content</span>
                  <svg
                    aria-hidden="true"
                    style={{
                      width: "18px",
                      height: "18px",
                      transform: editSeoSectionOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Toggle section</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {editSeoSectionOpen && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <label
                        htmlFor="edit-seo-meta-title"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        SEO Meta Title
                      </label>
                      <input
                        id="edit-seo-meta-title"
                        type="text"
                        value={editSeoMetaTitle}
                        onChange={(e) =>
                          onEditSeoMetaTitleChange(e.target.value)
                        }
                        placeholder="55–60 characters recommended"
                        style={{
                          width: "100%",
                          background: "rgba(17,19,34,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "7px 10px",
                          color: "#e0e0e0",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-seo-meta-description"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        SEO Meta Description
                      </label>
                      <textarea
                        id="edit-seo-meta-description"
                        value={editSeoMetaDescription}
                        onChange={(e) =>
                          onEditSeoMetaDescriptionChange(e.target.value)
                        }
                        rows={2}
                        placeholder="150–160 characters recommended"
                        style={{
                          width: "100%",
                          background: "rgba(17,19,34,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "7px 10px",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          resize: "vertical",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-hero-headline"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Hero Headline (H1)
                      </label>
                      <input
                        id="edit-hero-headline"
                        type="text"
                        value={editHeroHeadline}
                        onChange={(e) =>
                          onEditHeroHeadlineChange(e.target.value)
                        }
                        placeholder="Benefit-driven, 6–12 words"
                        style={{
                          width: "100%",
                          background: "rgba(17,19,34,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "7px 10px",
                          color: "#e0e0e0",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-hero-subheadline"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Hero Subheadline
                      </label>
                      <textarea
                        id="edit-hero-subheadline"
                        value={editHeroSubheadline}
                        onChange={(e) =>
                          onEditHeroSubheadlineChange(e.target.value)
                        }
                        rows={2}
                        placeholder="1–2 supporting sentences"
                        style={{
                          width: "100%",
                          background: "rgba(17,19,34,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "7px 10px",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          resize: "vertical",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-body-sections"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "6px",
                        }}
                      >
                        Body Sections
                      </label>
                      {editBodySectionsArr.map(
                        (section: BodySection, i: number) => (
                          <div
                            key={section.heading.slice(0, 20) || `sec-${i}`}
                            style={{
                              marginBottom: "10px",
                              padding: "10px",
                              background: "rgba(20,21,35,0.9)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "6px",
                              position: "relative",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                onEditBodySectionsArrChange(
                                  editBodySectionsArr.filter(
                                    (_: BodySection, idx: number) => idx !== i,
                                  ),
                                )
                              }
                              style={{
                                position: "absolute",
                                top: "6px",
                                right: "8px",
                                color: "#888",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "16px",
                              }}
                            >
                              ×
                            </button>
                            <input
                              type="text"
                              value={section.heading}
                              placeholder="Heading"
                              onChange={(e) =>
                                onEditBodySectionsArrChange(
                                  editBodySectionsArr.map(
                                    (s: BodySection, idx: number) =>
                                      idx === i
                                        ? { ...s, heading: e.target.value }
                                        : s,
                                  ),
                                )
                              }
                              style={{
                                width: "100%",
                                background: "rgba(17,19,34,0.8)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "4px",
                                padding: "5px 8px",
                                color: "#e0e0e0",
                                fontSize: "12px",
                                marginBottom: "6px",
                              }}
                            />
                            <textarea
                              value={section.body}
                              rows={2}
                              placeholder="Body text"
                              onChange={(e) =>
                                onEditBodySectionsArrChange(
                                  editBodySectionsArr.map(
                                    (s: BodySection, idx: number) =>
                                      idx === i
                                        ? { ...s, body: e.target.value }
                                        : s,
                                  ),
                                )
                              }
                              style={{
                                width: "100%",
                                background: "rgba(17,19,34,0.8)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "4px",
                                padding: "5px 8px",
                                color: "#e0e0e0",
                                fontSize: "12px",
                                resize: "vertical",
                              }}
                            />
                          </div>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onEditBodySectionsArrChange([
                            ...editBodySectionsArr,
                            { heading: "", body: "" },
                          ])
                        }
                        style={{
                          color: "#a0a0c0",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        + Add Section
                      </button>
                    </div>
                    <div>
                      <label
                        htmlFor="edit-proof-points"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "6px",
                        }}
                      >
                        Proof Points
                      </label>
                      {editProofPointsArr.map((point: string, i: number) => (
                        <div
                          key={point.slice(0, 20) || `pt-${i}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "6px",
                          }}
                        >
                          <input
                            type="text"
                            value={point}
                            onChange={(e) =>
                              onEditProofPointsArrChange(
                                editProofPointsArr.map(
                                  (v: string, idx: number) =>
                                    idx === i ? e.target.value : v,
                                ),
                              )
                            }
                            style={{
                              flex: 1,
                              background: "rgba(17,19,34,0.8)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "6px",
                              padding: "5px 8px",
                              color: "#e0e0e0",
                              fontSize: "12px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onEditProofPointsArrChange(
                                editProofPointsArr.filter(
                                  (_: string, idx: number) => idx !== i,
                                ),
                              )
                            }
                            style={{
                              color: "#888",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "16px",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          onEditProofPointsArrChange([
                            ...editProofPointsArr,
                            "",
                          ])
                        }
                        style={{
                          color: "#a0a0c0",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        + Add Proof Point
                      </button>
                    </div>
                    <div>
                      <label
                        htmlFor="edit-faq-items"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "6px",
                        }}
                      >
                        FAQ Items
                      </label>
                      {editFaqItemsArr.map((item: FaqItem, i: number) => (
                        <div
                          key={item.question.slice(0, 20) || `fq-${i}`}
                          style={{
                            marginBottom: "10px",
                            padding: "10px",
                            background: "rgba(20,21,35,0.9)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "6px",
                            position: "relative",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onEditFaqItemsArrChange(
                                editFaqItemsArr.filter(
                                  (_: FaqItem, idx: number) => idx !== i,
                                ),
                              )
                            }
                            style={{
                              position: "absolute",
                              top: "6px",
                              right: "8px",
                              color: "#888",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "16px",
                            }}
                          >
                            ×
                          </button>
                          <input
                            type="text"
                            value={item.question}
                            placeholder="Question"
                            maxLength={300}
                            onChange={(e) =>
                              onEditFaqItemsArrChange(
                                editFaqItemsArr.map(
                                  (f: FaqItem, idx: number) =>
                                    idx === i
                                      ? { ...f, question: e.target.value }
                                      : f,
                                ),
                              )
                            }
                            style={{
                              width: "100%",
                              background: "rgba(17,19,34,0.8)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "4px",
                              padding: "5px 8px",
                              color: "#e0e0e0",
                              fontSize: "12px",
                              marginBottom: "2px",
                            }}
                          />
                          <p
                            style={{
                              color: "#7A7D90",
                              fontSize: "12px",
                              marginTop: "2px",
                              marginBottom: "4px",
                            }}
                          >
                            {item.question.length} / 300
                          </p>
                          <textarea
                            value={item.answer}
                            rows={2}
                            placeholder="Answer"
                            maxLength={1000}
                            onChange={(e) =>
                              onEditFaqItemsArrChange(
                                editFaqItemsArr.map(
                                  (f: FaqItem, idx: number) =>
                                    idx === i
                                      ? { ...f, answer: e.target.value }
                                      : f,
                                ),
                              )
                            }
                            style={{
                              width: "100%",
                              background: "rgba(17,19,34,0.8)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "4px",
                              padding: "5px 8px",
                              color: "#e0e0e0",
                              fontSize: "12px",
                              resize: "vertical",
                            }}
                          />
                          <p
                            style={{
                              color: "#7A7D90",
                              fontSize: "12px",
                              marginTop: "2px",
                            }}
                          >
                            {item.answer.length} / 1000
                          </p>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          onEditFaqItemsArrChange([
                            ...editFaqItemsArr,
                            { question: "", answer: "" },
                          ])
                        }
                        style={{
                          color: "#a0a0c0",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        + Add FAQ
                      </button>
                    </div>
                    <div>
                      <label
                        htmlFor="edit-closing-cta"
                        style={{
                          display: "block",
                          color: "#e0e0e0",
                          fontSize: "12px",
                          marginBottom: "4px",
                        }}
                      >
                        Closing CTA
                      </label>
                      <input
                        id="edit-closing-cta"
                        type="text"
                        value={editClosingCTA}
                        onChange={(e) => onEditClosingCTAChange(e.target.value)}
                        placeholder="Short urgent line above the checkout button"
                        style={{
                          width: "100%",
                          background: "rgba(17,19,34,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "6px",
                          padding: "7px 10px",
                          color: "#e0e0e0",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {wasSaved && (
              <span
                style={{
                  color: "#22C55E",
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
                color: "#22C55E",
                fontSize: "14px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                textAlign: "right",
              }}
            >
              {formatPriceWithBilling(product)}
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
            color: isActive ? "#22C55E" : "#7A7D90",
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
