import { useSearch } from "@tanstack/react-router";
import { CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import TypewriterText from "../components/TypewriterText";
import { useActor } from "../hooks/useActor";

export default function AuditCheckoutPage() {
  const { actor, isFetching } = useActor();
  const search = useSearch({ strict: false }) as { lead_id?: string };
  const [leadId] = useState<string | undefined>(search?.lead_id);
  const [isLoading, setIsLoading] = useState(false);
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
      const sessionResult = await actor.createCheckoutSession(
        shoppingItems,
        "",
        successUrl,
        cancelUrl,
        "",
      );
      if ("ok" in sessionResult) {
        window.location.href = sessionResult.ok;
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
  }

  const deliverables = [
    "Mobile performance",
    "SEO basics",
    "Lead capture",
    "Trust signals",
    "Conversion gap analysis",
  ];

  return (
    <div className="min-h-screen bg-[#0A0B14] flex flex-col">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      {/* Page Header */}
      <section
        className="w-full py-16 px-4 bg-[#0A0B14] border-b border-[#5EF08A]/20"
        data-ocid="audit_checkout.page"
      >
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EF08A]/10 border border-[#5EF08A]/30 text-[#5EF08A] text-xs font-bold tracking-widest uppercase mb-6"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="SITE AUDIT" speed={60} />
          </div>
          <h1
            className="font-bold mb-4 text-white"
            style={{ fontSize: 36, fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="You're One Step Away." speed={45} />
          </h1>
          <p
            className="text-[#9DA0B3]"
            style={{ fontSize: 17, lineHeight: 1.6 }}
          >
            <TypewriterText
              text="Complete your $99 Site Audit payment and we'll deliver your report within 48 hours."
              speed={30}
            />
          </p>
        </div>
      </section>

      {/* Summary Card + Button */}
      <main className="flex-1 flex flex-col items-center px-4 py-12 bg-[#0A0B14]">
        <div
          className="w-full matrix-card"
          style={{ maxWidth: 560, borderRadius: 10, padding: 36 }}
          data-ocid="audit_checkout.card"
        >
          <h2
            className="font-bold mb-1 text-white"
            style={{ fontSize: 22, fontFamily: "'Courier New', monospace" }}
          >
            <TypewriterText text="Imperidome Site Audit" speed={50} />
          </h2>

          <div className="flex flex-wrap gap-4 mt-3 mb-5">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "rgba(94,240,138,0.1)",
                border: "1px solid rgba(94,240,138,0.3)",
              }}
            >
              <span
                className="font-bold text-[#5EF08A]"
                style={{ fontSize: 15 }}
              >
                <TypewriterText text="$99 one-time" speed={60} />
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "rgba(17,19,34,0.7)",
                border: "1px solid #1C1F33",
              }}
            >
              <Clock size={14} color="#7A7D90" />
              <span className="text-[#7A7D90]" style={{ fontSize: 14 }}>
                <TypewriterText text="48-hour turnaround" speed={50} />
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1C1F33", marginBottom: 20 }} />

          <p
            className="font-semibold mb-3 text-[#5EF08A]"
            style={{
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "'Courier New', monospace",
            }}
          >
            <TypewriterText text="What's Included" speed={55} />
          </p>
          <ul className="space-y-2 mb-6">
            {deliverables.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle
                  size={16}
                  color="#5EF08A"
                  style={{ flexShrink: 0 }}
                />
                <span className="text-[#EEF0F8]" style={{ fontSize: 15 }}>
                  <TypewriterText text={item} speed={45} />
                </span>
              </li>
            ))}
          </ul>

          <div
            style={{
              borderTop: "1px solid #1C1F33",
              marginTop: 8,
              marginBottom: 16,
            }}
          />

          <p
            className="text-center text-[#5EF08A]"
            style={{ fontSize: 14, fontStyle: "italic" }}
          >
            <TypewriterText
              text="$99 credited toward your build if you sign within 30 days."
              speed={30}
            />
          </p>
        </div>

        <div className="mt-8 w-full" style={{ maxWidth: 560 }}>
          <button
            type="button"
            onClick={handlePay}
            disabled={isLoading || isFetching}
            className="w-full py-4 rounded-lg font-semibold text-[#0A0B14] transition-all disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                isLoading || isFetching ? "rgba(94,240,138,0.5)" : "#5EF08A",
              fontSize: 17,
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
