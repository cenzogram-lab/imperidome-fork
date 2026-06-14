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
import TypewriterText from "../components/TypewriterText";
import { PENDING_ORDER_KEY } from "../constants";
import { useActor } from "../hooks/useActor";

const SESSION_KEY = "imperidome_order_confirmation_shown";

interface SessionMeta {
  customerName?: string;
  customerEmail?: string;
  services?: string[];
  amount?: string | number;
  [key: string]: unknown;
}

function parseSessionMeta(ok: string): SessionMeta | null {
  try {
    const parsed = JSON.parse(ok);
    if (parsed && typeof parsed === "object") return parsed as SessionMeta;
  } catch {
    /* plain message */
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
  const [contactEmail, setContactEmail] = useState<string>(
    "support@imperidome.com",
  );

  useEffect(() => {
    if (!actor) return;
    actor
      .getAdminContactEmail()
      .then(setContactEmail)
      .catch(() => {});
  }, [actor]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    if (!sessionId) {
      navigate({ to: "/" });
      return;
    }
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) {
      setRecordStatus("done");
      return;
    }
    hasFiredRef.current = true;
    const tryRecord = async () => {
      if (!actor || isFetching) return;
      try {
        let pendingCustomerName = "";
        let pendingCustomerEmail = "";
        let pendingServices: string[] = [];
        try {
          const stored = localStorage.getItem(PENDING_ORDER_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as {
              customerName?: string;
              customerEmail?: string;
              services?: unknown;
              items?: Array<{ price?: unknown }>;
              totalAmount?: unknown;
            };
            pendingCustomerName = parsed.customerName ?? "";
            pendingCustomerEmail = parsed.customerEmail ?? "";
            pendingServices = Array.isArray(parsed.services)
              ? (parsed.services as string[])
              : [];
          }
        } catch {
          // fall back to empty strings
        }
        const result = await actor.verifyAndRecordPurchase(
          sessionId,
          pendingCustomerName,
          pendingCustomerEmail,
          pendingServices,
        );
        localStorage.removeItem(PENDING_ORDER_KEY);
        if ("err" in result) {
          setRecordStatus("error");
        } else {
          sessionStorage.setItem(SESSION_KEY, "true");
          const meta = parseSessionMeta(result.ok);
          if (
            meta?.services &&
            Array.isArray(meta.services) &&
            meta.services.length > 0
          )
            setPurchasedItems(meta.services as string[]);
          else if (meta?.customerName) setPurchasedItems([]);
          setRecordStatus("done");

          // NEW-C-1: After deposit session completes, auto-initiate the pending
          // subscription checkout for Custom Site + hosting plan combinations.
          try {
            const pendingSub = localStorage.getItem(
              "imperidome_pending_subscription",
            );
            if (pendingSub) {
              const sub = JSON.parse(pendingSub) as {
                itemName?: string;
                itemPrice?: unknown;
                customerEmail?: string;
              };
              localStorage.removeItem("imperidome_pending_subscription");
              if (sub.itemName && actor) {
                const subPrice = Number(sub.itemPrice ?? 0);
                const subEmail = sub.customerEmail ?? pendingCustomerEmail;
                const subResult = await actor.createCheckoutSession(
                  [
                    {
                      productName: `[subscription] ${sub.itemName} | Monthly Hosting`,
                      productDescription: `${sub.itemName} — Monthly Hosting Plan`,
                      quantity: BigInt(1),
                      currency: "usd",
                      priceInCents: BigInt(Math.round(subPrice * 100)),
                    },
                  ],
                  subEmail,
                  `${window.location.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
                  `${window.location.origin}/`,
                  "",
                );
                if ("ok" in subResult) {
                  window.location.href = subResult.ok;
                }
              }
            }
          } catch {
            // If subscription initiation fails, silently continue — the user
            // can initiate the subscription separately. Do not block the
            // deposit confirmation page.
          }
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
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Navbar />
        <div className="h-[68px]" aria-hidden="true" />
        <main
          className="flex-1 flex items-center justify-center px-4 py-16 bg-slate-900"
          data-ocid="order_confirmation.error_page"
        >
          <div
            className="w-full bg-slate-800 border border-slate-700 rounded-xl"
            style={{ maxWidth: 600, borderRadius: 8, padding: 40 }}
            data-ocid="order_confirmation.error_card"
          >
            <div className="flex justify-center mb-6">
              <AlertCircle
                size={72}
                strokeWidth={1.5}
                color="#F87171"
                data-ocid="order_confirmation.error_icon"
              />
            </div>
            <h2
              className="text-center font-bold mb-3 text-white"
              style={{
                fontSize: 28,
                fontFamily: "'Plus Jakarta Sans', monospace",
              }}
            >
              <TypewriterText text="Something Went Wrong" speed={45} />
            </h2>
            <p
              className="text-center font-semibold mb-6 text-[#F87171]"
              style={{ fontSize: 17 }}
            >
              <TypewriterText
                text="We could not verify or record your purchase."
                speed={35}
              />
            </p>
            <p
              className="text-center mb-8 text-[#7A7D90]"
              style={{ fontSize: 15, lineHeight: 1.6 }}
            >
              <TypewriterText
                text="There was an error processing your order confirmation. Your payment may have gone through, but our system was unable to record it automatically. Please do not attempt to pay again."
                speed={20}
              />
            </p>
            <div
              className="rounded-lg border p-6"
              style={{
                borderColor: "rgba(248,113,113,0.3)",
                backgroundColor: "rgba(248,113,113,0.08)",
              }}
              data-ocid="order_confirmation.error_contact_block"
            >
              <p className="font-bold mb-2 text-white" style={{ fontSize: 16 }}>
                <TypewriterText
                  text="Contact us immediately to resolve this:"
                  speed={40}
                />
              </p>
              <p
                className="mb-3 text-[#9DA0B3]"
                style={{ fontSize: 15, lineHeight: 1.65 }}
              >
                <TypewriterText
                  text="Email us with your order details (name, email, and the product you purchased) and we will manually verify your payment and set up your account."
                  speed={18}
                />
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="font-bold text-[#F87171]"
                style={{ fontSize: 15 }}
                data-ocid="order_confirmation.error_contact_email"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading / pending state
  if (recordStatus === "pending") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <Navbar />
        <div className="h-[68px]" aria-hidden="true" />
        <main
          className="flex-1 flex items-center justify-center px-4 py-16 bg-slate-900"
          data-ocid="order_confirmation.pending_page"
        >
          <div
            className="w-full matrix-card text-center"
            style={{ maxWidth: 600, borderRadius: 8, padding: 40 }}
            data-ocid="order_confirmation.pending_card"
          >
            <div
              className="inline-block mb-6"
              style={{
                width: 56,
                height: 56,
                border: "3px solid #1C1F33",
                borderTop: "3px solid #22C55E",
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <p
              className="font-semibold text-white"
              style={{
                fontSize: 18,
                fontFamily: "'Plus Jakarta Sans', monospace",
              }}
            >
              <TypewriterText text="Verifying your payment…" speed={50} />
            </p>
            <p
              className="mt-2 text-[#7A7D90]"
              style={{ fontSize: 14, lineHeight: 1.6 }}
            >
              <TypewriterText
                text="Please wait while we confirm your Stripe session."
                speed={35}
              />
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

  // Success state
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <div className="h-[68px]" aria-hidden="true" />

      <main
        className="flex-1 flex items-center justify-center px-4 py-16 bg-slate-900"
        data-ocid="order_confirmation.page"
      >
        <div
          className="w-full bg-slate-800 border border-slate-700 rounded-xl"
          style={{ maxWidth: 600, borderRadius: 8, padding: 40 }}
          data-ocid="order_confirmation.card"
        >
          <div className="flex justify-center mb-6">
            <CheckCircle
              size={72}
              strokeWidth={1.5}
              color="#22C55E"
              data-ocid="order_confirmation.success_state"
            />
          </div>

          <h2
            className="text-center font-bold mb-3 text-white"
            style={{
              fontSize: 28,
              fontFamily: "'Plus Jakarta Sans', monospace",
            }}
          >
            <TypewriterText text="You Are In the Queue." speed={45} />
          </h2>
          <p
            className="text-center font-semibold mb-6 text-[#22C55E]"
            style={{ fontSize: 17 }}
          >
            <TypewriterText
              text="Payment received. Your build slot is secured."
              speed={35}
            />
          </p>

          {purchasedItems.length > 0 && (
            <div
              className="mb-6 rounded-lg border"
              style={{
                borderColor: "rgba(34,197,94,0.3)",
                backgroundColor: "rgba(34,197,94,0.05)",
                padding: "16px 20px",
              }}
              data-ocid="order_confirmation.items_summary"
            >
              <p
                className="font-semibold mb-2 text-[#22C55E]"
                style={{
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "'Plus Jakarta Sans', monospace",
                }}
              >
                Order Summary
              </p>
              <ul className="space-y-1">
                {purchasedItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-[#EEF0F8]"
                    style={{ fontSize: 15 }}
                  >
                    <span className="text-[#22C55E]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p
            className="text-center mb-8 text-[#7A7D90]"
            style={{ fontSize: 15, lineHeight: 1.6 }}
          >
            <TypewriterText
              text="Your order has been received. Log in to your portal to complete your site brief — your build won't start until we have it."
              speed={20}
            />
          </p>

          <div
            className="mb-8 rounded-lg border"
            style={{
              borderColor: "rgba(34,197,94,0.2)",
              backgroundColor: "rgba(34,197,94,0.05)",
              padding: "24px 28px",
            }}
            data-ocid="order_confirmation.next_step_card"
          >
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={20} color="#22C55E" />
              <h3
                className="font-bold text-white"
                style={{
                  fontSize: 17,
                  fontFamily: "'Plus Jakarta Sans', monospace",
                }}
              >
                <TypewriterText text="Complete Your Site Brief" speed={50} />
              </h3>
            </div>
            <p
              className="mb-6 text-[#9DA0B3]"
              style={{ fontSize: 15, lineHeight: 1.65 }}
            >
              <TypewriterText
                text="Log in to your Client Portal to complete your site questionnaire. Your build will not start until we receive your brief — this is your chance to tell us exactly what you need."
                speed={20}
              />
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/portal/dashboard" })}
              className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-[#0A0B14] transition-opacity hover:opacity-90 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500"
              style={{ fontSize: 16, padding: "14px 24px" }}
              data-ocid="order_confirmation.primary_button"
            >
              <LogIn size={18} />
              Login to Portal to Start Brief
            </button>
          </div>

          <div
            className="flex flex-col items-center gap-2"
            data-ocid="order_confirmation.build_status"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                backgroundColor: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.3)",
              }}
            >
              <Clock size={14} color="#F59E0B" />
              <span
                className="font-semibold text-[#F59E0B]"
                style={{ fontSize: 13 }}
              >
                <TypewriterText
                  text="Build Status: Waiting for Questionnaire"
                  speed={40}
                />
              </span>
            </div>
            <p
              className="text-center text-[#7A7D90]"
              style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 420 }}
            >
              <TypewriterText
                text="Once submitted, our team will review your brief within 24–48 hours and confirm your start date."
                speed={25}
              />
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
