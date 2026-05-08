import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  LogIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useActor } from "../hooks/useActor";

const SESSION_KEY = "imperidome_order_confirmation_shown";

interface SessionMeta {
  customerName?: string;
  customerEmail?: string;
  services?: string[];
  amount?: string | number;
  [key: string]: unknown;
}

/** Safely parse verifyAndRecordPurchase's ok string.
 *  Returns structured metadata if the string is valid JSON, otherwise null. */
function parseSessionMeta(ok: string): SessionMeta | null {
  try {
    const parsed = JSON.parse(ok);
    if (parsed && typeof parsed === "object") {
      return parsed as SessionMeta;
    }
  } catch {
    // Plain success message — not JSON
  }
  return null;
}

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [recordStatus, setRecordStatus] = useState<
    "pending" | "done" | "error"
  >("pending");
  const hasFiredRef = useRef(false);

  useEffect(() => {
    // Parse session_id directly from URL query parameters (Stripe appends this on redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (!sessionId) {
      navigate({ to: "/" });
      return;
    }

    // Idempotency guard: don't call verifyAndRecordPurchase again on refresh
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) {
      setRecordStatus("done");
      return;
    }

    hasFiredRef.current = true;

    const tryRecord = async () => {
      if (!actor || isFetching) return;
      try {
        // Pass sessionId as the primary key; email/name/services are best-effort
        // — the backend extracts authoritative data from Stripe.
        const result = await actor.verifyAndRecordPurchase(
          sessionId,
          "",
          "",
          [],
        );

        if ("err" in result) {
          setRecordStatus("error");
        } else {
          // Guard fires only after a confirmed successful response
          sessionStorage.setItem(SESSION_KEY, "true");
          // Derive display data from the ok string returned by the backend
          const meta = parseSessionMeta(result.ok);
          if (
            meta?.services &&
            Array.isArray(meta.services) &&
            meta.services.length > 0
          ) {
            setPurchasedItems(meta.services as string[]);
          } else if (meta?.customerName) {
            // Minimal display: at least show that an order was recorded
            setPurchasedItems([]);
          }
          setRecordStatus("done");
        }
      } catch {
        setRecordStatus("error");
      }
    };

    tryRecord();
  }, [actor, isFetching, navigate]);

  // Error state
  if (recordStatus === "error") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="h-[68px]" aria-hidden="true" />
        <main
          className="flex-1 flex items-center justify-center px-4 py-16"
          style={{ backgroundColor: "#FEF2F2" }}
          data-ocid="order_confirmation.error_page"
        >
          <div
            className="w-full bg-white"
            style={{
              maxWidth: 600,
              borderRadius: 8,
              padding: 40,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              border: "1px solid #FECACA",
            }}
            data-ocid="order_confirmation.error_card"
          >
            {/* Error icon */}
            <div className="flex justify-center mb-6">
              <AlertCircle
                size={72}
                strokeWidth={1.5}
                color="#DC2626"
                data-ocid="order_confirmation.error_icon"
              />
            </div>

            {/* Error heading */}
            <h2
              className="text-center font-bold mb-3"
              style={{ color: "#1B2D4F", fontSize: 28 }}
            >
              Something Went Wrong
            </h2>

            {/* Error subheadline */}
            <p
              className="text-center font-semibold mb-6"
              style={{ color: "#DC2626", fontSize: 17 }}
            >
              We could not verify or record your purchase.
            </p>

            {/* Error body */}
            <p
              className="text-center mb-8"
              style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6 }}
            >
              There was an error processing your order confirmation. Your
              payment may have gone through, but our system was unable to record
              it automatically. Please do not attempt to pay again.
            </p>

            {/* Contact block */}
            <div
              className="rounded-lg border"
              style={{
                borderColor: "#FECACA",
                backgroundColor: "#FFF5F5",
                padding: "24px 28px",
              }}
              data-ocid="order_confirmation.error_contact_block"
            >
              <p
                className="font-bold mb-2"
                style={{ color: "#1B2D4F", fontSize: 16 }}
              >
                Contact us immediately to resolve this:
              </p>
              <p
                className="mb-3"
                style={{ color: "#374151", fontSize: 15, lineHeight: 1.65 }}
              >
                Email us with your order details (name, email, and the product
                you purchased) and we will manually verify your payment and set
                up your account.
              </p>
              <a
                href="mailto:vincenzo@imperidome.com"
                className="font-bold"
                style={{ color: "#DC2626", fontSize: 15 }}
                data-ocid="order_confirmation.error_contact_email"
              >
                vincenzo@imperidome.com
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading / pending state while verifying
  if (recordStatus === "pending") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="h-[68px]" aria-hidden="true" />
        <main
          className="flex-1 flex items-center justify-center px-4 py-16"
          style={{ backgroundColor: "#EFF6FF" }}
          data-ocid="order_confirmation.pending_page"
        >
          <div
            className="w-full bg-white text-center"
            style={{
              maxWidth: 600,
              borderRadius: 8,
              padding: 40,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
            data-ocid="order_confirmation.pending_card"
          >
            <div
              className="inline-block mb-6"
              style={{
                width: 56,
                height: 56,
                border: "3px solid #DBEAFE",
                borderTop: "3px solid #3B82F6",
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <p
              className="font-semibold"
              style={{ color: "#1B2D4F", fontSize: 18 }}
            >
              Verifying your payment…
            </p>
            <p
              className="mt-2"
              style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6 }}
            >
              Please wait while we confirm your Stripe session.
            </p>
            <style>
              {"@keyframes spin { to { transform: rotate(360deg); } }"}
            </style>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state — only renders when recordStatus === "done"
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      <main
        className="flex-1 flex items-center justify-center px-4 py-16"
        style={{ backgroundColor: "#EFF6FF" }}
        data-ocid="order_confirmation.page"
      >
        <div
          className="w-full bg-white"
          style={{
            maxWidth: 600,
            borderRadius: 8,
            padding: 40,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
          data-ocid="order_confirmation.card"
        >
          {/* Green checkmark icon */}
          <div className="flex justify-center mb-6">
            <CheckCircle
              size={72}
              strokeWidth={1.5}
              color="#166534"
              data-ocid="order_confirmation.success_state"
            />
          </div>

          {/* Heading */}
          <h2
            className="text-center font-bold mb-3"
            style={{ color: "#1B2D4F", fontSize: 28 }}
          >
            You Are In the Queue.
          </h2>

          {/* Subheadline */}
          <p
            className="text-center font-semibold mb-6"
            style={{ color: "#166534", fontSize: 17 }}
          >
            Payment received. Your build slot is secured.
          </p>

          {/* Purchased items summary — shown only if metadata contains services */}
          {purchasedItems.length > 0 && (
            <div
              className="mb-6 rounded-lg border"
              style={{
                borderColor: "#D1FAE5",
                backgroundColor: "#F0FDF4",
                padding: "16px 20px",
              }}
              data-ocid="order_confirmation.items_summary"
            >
              <p
                className="font-semibold mb-2"
                style={{
                  color: "#166534",
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Order Summary
              </p>
              <ul className="space-y-1">
                {purchasedItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2"
                    style={{ color: "#1B2D4F", fontSize: 15 }}
                  >
                    <span style={{ color: "#166534" }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Body */}
          <p
            className="text-center mb-8"
            style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6 }}
          >
            Your order has been received. Log in to your portal to complete your
            site brief — your build won&rsquo;t start until we have it.
          </p>

          {/* Next Step Card */}
          <div
            className="mb-8 rounded-lg border"
            style={{
              borderColor: "#BFDBFE",
              backgroundColor: "#EFF6FF",
              padding: "24px 28px",
            }}
            data-ocid="order_confirmation.next_step_card"
          >
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={20} color="#3B82C4" />
              <h3
                className="font-bold"
                style={{ color: "#1B2D4F", fontSize: 17 }}
              >
                Complete Your Site Brief
              </h3>
            </div>
            <p
              className="mb-6"
              style={{ color: "#374151", fontSize: 15, lineHeight: 1.65 }}
            >
              Log in to your Client Portal to complete your site questionnaire.
              Your build will not start until we receive your brief — this is
              your chance to tell us exactly what you need.
            </p>

            {/* Primary CTA — full-width prominent */}
            <button
              type="button"
              onClick={() => navigate({ to: "/portal/dashboard" })}
              className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#166534",
                fontSize: 16,
                padding: "14px 24px",
              }}
              data-ocid="order_confirmation.primary_button"
            >
              <LogIn size={18} />
              Login to Portal to Start Brief
            </button>
          </div>

          {/* Build Status */}
          <div
            className="flex flex-col items-center gap-2"
            data-ocid="order_confirmation.build_status"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                backgroundColor: "#FEF3C7",
                border: "1px solid #FDE68A",
              }}
            >
              <Clock size={14} color="#92400E" />
              <span
                className="font-semibold"
                style={{ color: "#92400E", fontSize: 13 }}
              >
                Build Status: Waiting for Questionnaire
              </span>
            </div>
            <p
              className="text-center"
              style={{
                color: "#9CA3AF",
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 420,
              }}
            >
              Once submitted, our team will review your brief within 24–48 hours
              and confirm your start date.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
