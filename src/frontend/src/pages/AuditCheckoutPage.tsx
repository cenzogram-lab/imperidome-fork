import { useSearch } from "@tanstack/react-router";
import { CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useActor } from "../hooks/useActor";

export default function AuditCheckoutPage() {
  const { actor, isFetching } = useActor();
  // Silently read and preserve lead_id from URL for later use
  const search = useSearch({ strict: false }) as { lead_id?: string };
  const [leadId] = useState<string | undefined>(search?.lead_id);
  const [isLoading, setIsLoading] = useState(false);

  // leadId is preserved in state for future Stripe wiring
  void leadId;

  async function handlePay() {
    if (!actor || isFetching) {
      toast.error("Still connecting to the backend. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const shoppingItems = [
        {
          productName: "Imperidome Site Audit",
          currency: "usd",
          quantity: 1n,
          priceInCents: 9900n,
          productDescription:
            "Comprehensive site audit covering mobile performance, SEO basics, lead capture, trust signals, and conversion gap analysis.",
        },
      ];

      const successUrl = `${window.location.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/audit-checkout`;

      const checkoutUrl = await actor.createCheckoutSession(
        shoppingItems,
        successUrl,
        cancelUrl,
      );

      window.location.href = checkoutUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
      setIsLoading(false);
    }
  }

  const deliverables = [
    "Mobile performance",
    "SEO basics",
    "Lead capture",
    "Trust signals",
    "Conversion gap analysis",
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {/* Page Header */}
      <section
        className="w-full py-16 px-4"
        style={{ backgroundColor: "#1B2D4F" }}
        data-ocid="audit_checkout.page"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h1
            className="font-bold mb-4"
            style={{ color: "#FFFFFF", fontSize: 36 }}
          >
            You're One Step Away.
          </h1>
          <p
            style={{
              color: "#FFFFFF",
              fontSize: 17,
              lineHeight: 1.6,
              opacity: 0.9,
            }}
          >
            Complete your $99 Site Audit payment and we'll deliver your report
            within 48 hours.
          </p>
        </div>
      </section>

      {/* Summary Card + Button */}
      <main
        className="flex-1 flex flex-col items-center px-4 py-12"
        style={{ backgroundColor: "#F9FAFB" }}
      >
        {/* Summary Card */}
        <div
          className="w-full bg-white"
          style={{
            maxWidth: 560,
            borderRadius: 10,
            padding: 36,
            boxShadow: "0 1px 6px rgba(0,0,0,0.09)",
            border: "1px solid #E5E7EB",
          }}
          data-ocid="audit_checkout.card"
        >
          {/* Card Title */}
          <h2
            className="font-bold mb-1"
            style={{ color: "#1B2D4F", fontSize: 22 }}
          >
            Imperidome Site Audit
          </h2>

          {/* Price & Turnaround row */}
          <div className="flex flex-wrap gap-4 mt-3 mb-5">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
              }}
            >
              <span
                className="font-bold"
                style={{ color: "#3B82C4", fontSize: 15 }}
              >
                $99 one-time
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "#F3F4F6",
                border: "1px solid #E5E7EB",
              }}
            >
              <Clock size={14} color="#6B7280" />
              <span style={{ color: "#6B7280", fontSize: 14 }}>
                48-hour turnaround
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #E5E7EB", marginBottom: 20 }} />

          {/* What's Included */}
          <p
            className="font-semibold mb-3"
            style={{
              color: "#1B2D4F",
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            What's Included
          </p>
          <ul className="space-y-2 mb-6">
            {deliverables.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle
                  size={16}
                  color="#3B82C4"
                  style={{ flexShrink: 0 }}
                />
                <span style={{ color: "#1B2D4F", fontSize: 15 }}>{item}</span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid #E5E7EB",
              marginTop: 8,
              marginBottom: 16,
            }}
          />

          {/* Footer Note */}
          <p
            className="text-center"
            style={{
              color: "#3B82C4",
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            $99 credited toward your build if you sign within 30 days.
          </p>
        </div>

        {/* CTA Button */}
        <div className="mt-8 w-full" style={{ maxWidth: 560 }}>
          <button
            type="button"
            onClick={handlePay}
            disabled={isLoading || isFetching}
            className="w-full py-4 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#3B82C4",
              fontSize: 17,
              opacity: isLoading || isFetching ? 0.7 : 1,
            }}
            data-ocid="audit_checkout.primary_button"
          >
            {isLoading
              ? "Redirecting to Checkout…"
              : "Pay $99 & Submit Audit Request"}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
