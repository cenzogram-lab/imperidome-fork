import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeDollarSign,
  Check,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d.ts";
import { Footer } from "../components/Footer";
import TypewriterText from "../components/TypewriterText";
import { useActor } from "../hooks/useActor";
import { useCartStore } from "../store/useCartStore";

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(17,19,34,0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid #1C1F33",
  borderRadius: "16px",
  padding: "32px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(19,21,36,1)",
  border: "1px solid #1C1F33",
  borderRadius: "8px",
  color: "#EEF0F8",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  color: "#7A7D90",
  fontSize: "13px",
  marginBottom: "6px",
  fontWeight: 500,
};

const features = [
  "Custom design tailored to your brand",
  "Booking portal with confirmation emails",
  "Mobile-optimised, fully responsive layout",
  "30-day post-launch support window",
];

const included = [
  "Domain & SSL configuration",
  "On-page SEO setup",
  "Analytics integration",
  "Full source ownership & handoff",
];

/** Parse a price string like "$3,500", "3500", or "3500.00" → number of dollars */
function parsePriceDollars(price: string): number {
  const cleaned = price.replace(/[$,\s]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Format a dollar amount for display */
function formatDollars(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

/**
 * Extract the correct live price from a backend Product record.
 * Matches the same logic used in CheckoutDrawer.
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const items = useCartStore((s) => s.items);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    company: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Compute total from cart items
  const cartTotal = items.reduce(
    (sum, item) => sum + parsePriceDollars(item.price),
    0,
  );

  const handlePayment = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Please fill in your name and email before proceeding.");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!actor || isFetching) {
      toast.error("Still connecting to the backend. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch live product catalog for richer descriptions and live prices
      let products: Product[] = [];
      try {
        products = await actor.getProducts();
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setPricingError(
          "Unable to verify current pricing. Please refresh before completing your purchase.",
        );
      }

      // Build ShoppingItem[] from cart, using live catalog prices when available
      const shoppingItems = items.map((item) => {
        const match = products.find(
          (p) => p.name.toLowerCase() === item.name.toLowerCase(),
        );
        // Use live backend price when found; fall back to price stored in cart
        const dollars = match
          ? getProductPrice(match)
          : parsePriceDollars(item.price);
        const priceInCents = BigInt(Math.round(dollars * 100));
        return {
          productName: item.name,
          currency: "usd",
          quantity: 1n,
          priceInCents,
          productDescription: match?.description ?? item.name,
        };
      });

      const successUrl = `${window.location.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/checkout`;

      const STRIPE_SESSION_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";
      for (const url of [successUrl, cancelUrl]) {
        const m = url.match(/\{[^}]+\}/);
        if (m && m[0] !== STRIPE_SESSION_PLACEHOLDER) {
          console.error(
            "Warning: success/cancel URL contains a potentially malformed Stripe session placeholder. Expected: {CHECKOUT_SESSION_ID}",
          );
        }
      }

      let sessionResult: Awaited<
        ReturnType<typeof actor.createCheckoutSession>
      >;
      try {
        sessionResult = await actor.createCheckoutSession(
          shoppingItems,
          form.email,
          successUrl,
          cancelUrl,
          form.fullName,
        );
      } catch (err) {
        console.error("Checkout session creation failed:", err);
        setCheckoutError(
          "Something went wrong. Please try again or contact support.",
        );
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe checkout or internal pending page
      if ("ok" in sessionResult) {
        const url = sessionResult.ok;
        if (url.startsWith("/portal/subscriptions")) {
          navigate({ to: url });
        } else {
          window.location.href = url;
        }
      } else if ("err" in sessionResult) {
        toast.error(sessionResult.err || "Checkout session creation failed.");
        setIsLoading(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0B14",
          padding: "48px 16px 80px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1
            data-ocid="checkout.page"
            style={{
              color: "#EEF0F8",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 700,
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}
          >
            Complete Your Order
          </h1>
          <p style={{ color: "#7A7D90", fontSize: "16px", margin: 0 }}>
            You&rsquo;re one step away from your sovereign digital asset.
          </p>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* LEFT — Order Summary */}
          <div style={CARD_STYLE}>
            <p
              style={{
                color: "#7A7D90",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              <TypewriterText text="Order Summary" speed={35} as="span" />
            </p>

            {items.length > 0 ? (
              <>
                {/* Cart items */}
                <div style={{ marginBottom: "20px" }}>
                  {items.map((item, i) => (
                    <div
                      key={`${item.name}-${i}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          color: "#EEF0F8",
                          fontSize: "15px",
                          fontWeight: 600,
                        }}
                      >
                        {item.name}
                      </span>
                      <span
                        style={{
                          color: "#5EF08A",
                          fontSize: "15px",
                          fontWeight: 700,
                          marginLeft: "16px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.price.startsWith("$")
                          ? item.price
                          : formatDollars(parsePriceDollars(item.price))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div
                  style={{
                    borderTop: "1px solid #1C1F33",
                    paddingTop: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      color: "#7A7D90",
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      color: "#5EF08A",
                      fontSize: "36px",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {formatDollars(cartTotal)}
                  </span>
                </div>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "13px",
                    marginBottom: "28px",
                  }}
                >
                  One-time project fee
                </p>
              </>
            ) : (
              <div style={{ marginBottom: "28px" }}>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "15px",
                    fontStyle: "italic",
                  }}
                >
                  Add items to cart to see your total here.
                </p>
              </div>
            )}

            {/* Feature bullets */}
            <div style={{ marginBottom: "28px" }}>
              {features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <Check
                    size={16}
                    color="#5EF08A"
                    style={{ marginTop: "2px", flexShrink: 0 }}
                  />
                  <span style={{ color: "#7A7D90", fontSize: "14px" }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* What's Included */}
            <div
              style={{
                borderTop: "1px solid #1C1F33",
                paddingTop: "24px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  marginBottom: "14px",
                }}
              >
                <TypewriterText text="What's Included" speed={35} as="span" />
              </p>
              {included.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <Check
                    size={14}
                    color="#5EF08A"
                    style={{ marginTop: "2px", flexShrink: 0 }}
                  />
                  <span style={{ color: "#EEF0F8", fontSize: "13px" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Deposit note */}
            <div
              style={{
                background: "rgba(251,191,36,0.07)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <AlertTriangle
                size={15}
                color="#FBBF24"
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <p
                style={{
                  color: "#FBBF24",
                  fontSize: "12px",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Custom builds require a <strong>50% deposit</strong> to begin.
                Remaining balance is due at launch.
              </p>
            </div>
          </div>

          {/* RIGHT — Payment Form */}
          <div style={CARD_STYLE}>
            <p
              style={{
                color: "#7A7D90",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
                marginBottom: "24px",
              }}
            >
              <TypewriterText text="Your Details" speed={35} as="span" />
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" style={LABEL_STYLE}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.fullName}
                  onChange={handleChange}
                  style={INPUT_STYLE}
                  data-ocid="checkout.input"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={LABEL_STYLE}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                  style={INPUT_STYLE}
                  data-ocid="checkout.input"
                />
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" style={LABEL_STYLE}>
                  Company Name <span style={{ opacity: 0.5 }}>(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={handleChange}
                  style={INPUT_STYLE}
                  data-ocid="checkout.input"
                />
              </div>

              {/* Order Notes */}
              <div>
                <label htmlFor="notes" style={LABEL_STYLE}>
                  Order Notes <span style={{ opacity: 0.5 }}>(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Anything we should know before we begin…"
                  value={form.notes}
                  onChange={handleChange}
                  style={{ ...INPUT_STYLE, resize: "vertical" }}
                  data-ocid="checkout.textarea"
                />
              </div>

              {/* Error messages */}
              {pricingError && (
                <p
                  className="text-red-500 text-sm mt-2"
                  data-ocid="checkout.error_state"
                >
                  Pricing could not be verified. Please refresh before
                  continuing.
                </p>
              )}
              {checkoutError && (
                <div
                  className="text-red-500 text-sm mb-2"
                  data-ocid="checkout.error_state"
                >
                  {checkoutError}
                </div>
              )}

              {/* CTA Button */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={isLoading || !!pricingError || !!checkoutError}
                data-ocid="checkout.primary_button"
                style={{
                  width: "100%",
                  background: isLoading ? "rgba(94,240,138,0.5)" : "#5EF08A",
                  color: "#0A0B14",
                  fontWeight: 700,
                  fontSize: "16px",
                  borderRadius: "12px",
                  padding: "14px",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  letterSpacing: "-0.01em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    Processing…
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Proceed to Secure Payment
                  </>
                )}
              </button>

              {/* Security badges */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                  paddingTop: "4px",
                }}
              >
                {[
                  { icon: <Lock size={12} />, label: "SSL Encrypted" },
                  { icon: <Shield size={12} />, label: "Stripe Secured" },
                  {
                    icon: <BadgeDollarSign size={12} />,
                    label: "No Hidden Fees",
                  },
                ].map(({ icon, label }, i) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    {i > 0 && (
                      <div
                        style={{
                          width: "1px",
                          height: "14px",
                          background: "#1C1F33",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#7A7D90",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {icon}
                      <TypewriterText text={label} speed={30} as="span" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      <Footer />
    </>
  );
}
