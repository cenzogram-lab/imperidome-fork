import { Loader2, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { backendInterface } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PortalProduct {
  id: string;
  name: string;
  description: string;
  priceOneTime: number | undefined;
  priceMonthly: number;
  priceAnnual: number;
  category: string;
}

type Frequency = "one-time" | "monthly" | "annual";

interface ToastState {
  message: string;
  type: "success" | "error";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getBestPrice(p: PortalProduct): { price: number; freq: Frequency } {
  if (p.priceOneTime !== undefined && p.priceOneTime > 0)
    return { price: p.priceOneTime, freq: "one-time" };
  if (p.priceMonthly > 0) return { price: p.priceMonthly, freq: "monthly" };
  return { price: p.priceAnnual, freq: "annual" };
}

function freqLabel(f: Frequency): string {
  if (f === "one-time") return "One-time";
  if (f === "monthly") return "per month";
  return "per year";
}

function availableFrequencies(p: PortalProduct): Frequency[] {
  const freqs: Frequency[] = [];
  if (p.priceOneTime !== undefined && p.priceOneTime > 0)
    freqs.push("one-time");
  if (p.priceMonthly > 0) freqs.push("monthly");
  if (p.priceAnnual > 0) freqs.push("annual");
  return freqs;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({
  toast,
  onDismiss,
}: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      data-ocid="shop.toast"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        padding: "14px 20px",
        borderRadius: "10px",
        background:
          toast.type === "success"
            ? "rgba(5,46,22,0.95)"
            : "rgba(69,10,10,0.95)",
        border: `1px solid ${
          toast.type === "success"
            ? "rgba(94,240,138,0.4)"
            : "rgba(239,68,68,0.4)"
        }`,
        color: toast.type === "success" ? "#86EFAC" : "#FCA5A5",
        fontSize: "14px",
        fontWeight: 600,
        maxWidth: "420px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          opacity: 0.6,
          fontSize: "16px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Request Modal
// ---------------------------------------------------------------------------
interface RequestModalProps {
  product: PortalProduct;
  onClose: () => void;
  onSubmit: (productId: string, freq: Frequency) => Promise<void>;
  submitting: boolean;
}

function RequestModal({
  product,
  onClose,
  onSubmit,
  submitting,
}: RequestModalProps) {
  const freqs = availableFrequencies(product);
  const [selectedFreq, setSelectedFreq] = useState<Frequency>(
    freqs[0] ?? "one-time",
  );

  const priceMap: Record<Frequency, number> = {
    "one-time": product.priceOneTime ?? 0,
    monthly: product.priceMonthly,
    annual: product.priceAnnual,
  };

  return (
    <div
      data-ocid="shop.dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) =>
        (e.key === "Escape" || e.key === "Enter") &&
        e.target === e.currentTarget &&
        onClose()
      }
      role="presentation"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(14,16,32,0.98)",
          border: "1px solid #1C1F33",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          data-ocid="shop.close_button"
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#7A7D90",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={18} />
        </button>

        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#EEF0F8",
          }}
        >
          Request Purchase
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "14px",
            color: "#7A7D90",
            lineHeight: "1.5",
          }}
        >
          {product.name}
        </p>

        {/* Frequency selector (only if multiple) */}
        {freqs.length > 1 && (
          <div style={{ marginBottom: "20px" }}>
            <span
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#7A7D90",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Billing Frequency
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {freqs.map((f) => (
                <button
                  key={f}
                  type="button"
                  data-ocid={`shop.freq.${f}`}
                  onClick={() => setSelectedFreq(f)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    border:
                      selectedFreq === f
                        ? "1px solid rgba(94,240,138,0.6)"
                        : "1px solid #2A2D42",
                    background:
                      selectedFreq === f
                        ? "rgba(94,240,138,0.1)"
                        : "rgba(17,19,34,0.7)",
                    color: selectedFreq === f ? "#5EF08A" : "#7A7D90",
                  }}
                >
                  {freqLabel(f)}
                  {priceMap[f] > 0 && (
                    <span style={{ marginLeft: "6px", opacity: 0.8 }}>
                      — {formatPrice(priceMap[f])}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price summary */}
        <div
          style={{
            background: "rgba(94,240,138,0.06)",
            border: "1px solid rgba(94,240,138,0.15)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", color: "#7A7D90" }}>
            {freqLabel(freqs.length === 1 ? freqs[0] : selectedFreq)}
          </span>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#5EF08A" }}>
            {formatPrice(priceMap[selectedFreq])}
          </span>
        </div>

        <p
          style={{
            margin: "0 0 20px",
            fontSize: "13px",
            color: "#7A7D90",
            lineHeight: "1.6",
          }}
        >
          Your request will be reviewed by our team. You'll receive a
          notification once it's approved and an invoice is ready.
        </p>

        <button
          type="button"
          data-ocid="shop.submit_button"
          onClick={() => onSubmit(product.id, selectedFreq)}
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px",
            minHeight: "44px",
            background: submitting ? "rgba(94,240,138,0.3)" : "#5EF08A",
            color: submitting ? "rgba(94,240,138,0.6)" : "#061209",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "15px",
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.2s",
          }}
        >
          {submitting ? (
            <>
              <Loader2
                size={16}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              Submitting…
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product card
// ---------------------------------------------------------------------------
function ProductCard({
  product,
  index,
  onRequest,
}: {
  product: PortalProduct;
  index: number;
  onRequest: (p: PortalProduct) => void;
}) {
  const { price, freq } = getBestPrice(product);

  return (
    <div
      data-ocid={`shop.item.${index + 1}`}
      style={{
        background: "rgba(17,19,34,0.8)",
        border: "1px solid #1C1F33",
        borderRadius: "14px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(94,240,138,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#1C1F33";
      }}
    >
      {/* Category badge */}
      {product.category && (
        <span
          style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "20px",
            background: "rgba(94,240,138,0.08)",
            border: "1px solid rgba(94,240,138,0.2)",
            color: "rgba(94,240,138,0.7)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            alignSelf: "flex-start",
          }}
        >
          {product.category}
        </span>
      )}

      {/* Name */}
      <h3
        style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: 700,
          color: "#EEF0F8",
          lineHeight: "1.3",
        }}
      >
        {product.name}
      </h3>

      {/* Description */}
      {product.description && (
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#7A7D90",
            lineHeight: "1.6",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {product.description}
        </p>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Price + CTA row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "4px",
        }}
      >
        <div>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "#5EF08A" }}>
            {formatPrice(price)}
          </span>
          <span
            style={{ fontSize: "12px", color: "#7A7D90", marginLeft: "4px" }}
          >
            {freqLabel(freq)}
          </span>
        </div>
        <button
          type="button"
          data-ocid={`shop.request_button.${index + 1}`}
          onClick={() => onRequest(product)}
          style={{
            background: "rgba(94,240,138,0.1)",
            border: "1px solid rgba(94,240,138,0.4)",
            color: "#5EF08A",
            padding: "11px 18px",
            minHeight: "44px",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(94,240,138,0.2)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(94,240,138,0.7)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(94,240,138,0.1)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(94,240,138,0.4)";
          }}
        >
          Request Purchase
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PortalShopPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PortalProduct | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;

    async function load() {
      try {
        const result = await (
          actor as backendInterface
        ).getPortalShopProducts();
        if (!cancelled) {
          const mapped: PortalProduct[] = (
            Array.isArray(result) ? result : []
          ).map((p) => ({
            id: String(p.id),
            name: p.name,
            description: p.description,
            priceOneTime: p.price_onetime ?? undefined,
            priceMonthly: p.price_monthly ?? 0,
            priceAnnual: p.price_annual ?? 0,
            category: p.product_type,
          }));
          setProducts(mapped);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  async function handleSubmitRequest(productId: string, freq: Frequency) {
    if (!actor || !userEmail) return;
    setSubmitting(true);
    try {
      const result = await (actor as backendInterface).createPurchaseRequest(
        userEmail,
        BigInt(productId),
        freq,
      );
      if (result && typeof result === "object" && "ok" in result) {
        setToast({
          message:
            "Your request has been submitted — we will review it shortly.",
          type: "success",
        });
        setSelectedProduct(null);
      } else {
        const errMsg =
          result?.err && typeof result.err === "string"
            ? result.err
            : "Failed to submit request. Please try again.";
        setToast({ message: errMsg, type: "error" });
      }
    } catch {
      setToast({
        message: "Failed to submit request. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalLayout pageTitle="Shop">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>

      <div
        data-ocid="shop.page"
        style={{
          maxWidth: "1000px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <div data-ocid="shop.section">
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            Shop
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}>
            Browse available services and request a purchase. Our team will
            review and send you an invoice.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div
            data-ocid="shop.loading_state"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "rgba(17,19,34,0.8)",
                  border: "1px solid #1C1F33",
                  borderRadius: "14px",
                  padding: "24px",
                  height: "200px",
                  backgroundImage:
                    "linear-gradient(90deg, rgba(40,45,70,0.4) 25%, rgba(60,65,90,0.4) 50%, rgba(40,45,70,0.4) 75%)",
                  backgroundSize: "800px 100%",
                  animation: "shimmer 1.5s infinite linear",
                }}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && products.length === 0 && (
          <div
            data-ocid="shop.empty_state"
            style={{
              background: "rgba(17,19,34,0.7)",
              border: "1px solid #1C1F33",
              borderRadius: "14px",
              padding: "56px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(94,240,138,0.08)",
                border: "1px solid rgba(94,240,138,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <ShoppingBag
                size={26}
                style={{ color: "rgba(94,240,138,0.5)" }}
              />
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#EEF0F8",
              }}
            >
              No products available
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#7A7D90",
                maxWidth: "340px",
                marginInline: "auto",
                lineHeight: "1.6",
              }}
            >
              No products are currently available in the shop. Check back soon.
            </p>
          </div>
        )}

        {/* Product grid */}
        {!loading && products.length > 0 && (
          <div
            data-ocid="shop.list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                index={idx}
                onRequest={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Request modal */}
      {selectedProduct && (
        <RequestModal
          product={selectedProduct}
          onClose={() => !submitting && setSelectedProduct(null)}
          onSubmit={handleSubmitRequest}
          submitting={submitting}
        />
      )}

      {/* Toast */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </PortalLayout>
  );
}
