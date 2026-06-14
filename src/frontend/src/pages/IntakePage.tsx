import { useRouterState } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Film,
  Globe,
  MessageSquare,
  Search,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import { Footer } from "../components/Footer";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";

// ─── Zustand store ────────────────────────────────────────────────────────────
interface IntakeStore {
  step: number;
  serviceType: string;
  businessName: string;
  industry: string;
  monthlyRevenue: string;
  websiteUrl: string;
  fullName: string;
  email: string;
  phone: string;
  bestTime: string;
  setField: (key: string, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const useIntakeStore = create<IntakeStore>((set) => ({
  step: 1,
  serviceType: "",
  businessName: "",
  industry: "",
  monthlyRevenue: "",
  websiteUrl: "",
  fullName: "",
  email: "",
  phone: "",
  bestTime: "",
  setField: (key, value) => set((s) => ({ ...s, [key]: value })),
  nextStep: () => set((s) => ({ ...s, step: Math.min(s.step + 1, 4) })),
  prevStep: () => set((s) => ({ ...s, step: Math.max(s.step - 1, 1) })),
  reset: () =>
    set({
      step: 1,
      serviceType: "",
      businessName: "",
      industry: "",
      monthlyRevenue: "",
      websiteUrl: "",
      fullName: "",
      email: "",
      phone: "",
      bestTime: "",
    }),
}));

const STEPS = ["Service", "Business", "Contact", "Confirm"];

const SERVICE_OPTIONS = [
  {
    id: "custom",
    label: "Custom Sites",
    icon: Globe,
    desc: "Bespoke, full-build web presence",
  },
  {
    id: "speedy",
    label: "Speedy Sites",
    icon: Zap,
    desc: "Live in 48 hours, zero fuss",
  },
  {
    id: "ai-receptionist",
    label: "AI Receptionists",
    icon: Bot,
    desc: "24/7 automated client intake",
  },
  {
    id: "cinematic",
    label: "Cinematic Ads",
    icon: Film,
    desc: "Video campaigns that convert",
  },
  {
    id: "product-ads",
    label: "Product Ads",
    icon: ShoppingCart,
    desc: "Scroll-stopping product ad creative",
  },
  {
    id: "audit",
    label: "Professional Site Audit ($99)",
    icon: Search,
    desc: "5 critical fixes that recover lost leads",
    price: "$99",
  },
  {
    id: "consultation",
    label: "Free Strategy Consultation",
    icon: MessageSquare,
    desc: "30-minute call to map your digital growth",
  },
];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Restaurant & Food",
  "Retail & E-commerce",
  "Professional Services",
  "Real Estate",
  "Fitness & Wellness",
  "Education",
  "Creative & Media",
  "Other",
];

const REVENUE_OPTIONS = [
  "$3k\u2013$10k/mo",
  "$10k\u2013$30k/mo",
  "$30k\u2013$100k/mo",
  "$100k+/mo",
  "Pre-revenue",
];

const BEST_TIMES = [
  "Morning (9am\u201312pm)",
  "Afternoon (12pm\u20135pm)",
  "Evening (5pm\u20138pm)",
  "Anytime",
];

const BG = "#0A0B14";
const CARD = "rgba(17,19,34,0.7)";
const BORDER = "#1C1F33";
const PRIMARY = "#5EF08A";
const TEXT = "#EEF0F8";
const MUTED = "#7A7D90";
const INPUT_BG = "rgba(19,21,36,1)";
const BTN_DARK = "#061209";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: INPUT_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  padding: "10px 14px",
  color: TEXT,
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: MUTED,
  fontSize: "13px",
  marginBottom: "6px",
  fontWeight: 500,
};

const fieldWrap: React.CSSProperties = { marginBottom: "20px" };

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ color: "#F87171", fontSize: "12px", marginTop: "4px" }}>
      {msg}
    </p>
  );
}

function ProgressBar({
  step,
  showCelebration,
}: {
  step: number;
  showCelebration: boolean;
}) {
  // Particle positions spread across the progress bar width
  const particles: {
    left: string;
    color: string;
    delay: string;
    translateY: string;
    rotate: string;
  }[] = [
    {
      left: "5%",
      color: PARTICLE_COLORS[0],
      delay: "0ms",
      translateY: "-80px",
      rotate: "30deg",
    },
    {
      left: "13%",
      color: PARTICLE_COLORS[1],
      delay: "50ms",
      translateY: "-110px",
      rotate: "-20deg",
    },
    {
      left: "21%",
      color: PARTICLE_COLORS[2],
      delay: "100ms",
      translateY: "-70px",
      rotate: "45deg",
    },
    {
      left: "30%",
      color: PARTICLE_COLORS[3],
      delay: "150ms",
      translateY: "-100px",
      rotate: "-35deg",
    },
    {
      left: "38%",
      color: PARTICLE_COLORS[0],
      delay: "200ms",
      translateY: "-90px",
      rotate: "60deg",
    },
    {
      left: "46%",
      color: PARTICLE_COLORS[1],
      delay: "0ms",
      translateY: "-120px",
      rotate: "-50deg",
    },
    {
      left: "54%",
      color: PARTICLE_COLORS[2],
      delay: "75ms",
      translateY: "-75px",
      rotate: "25deg",
    },
    {
      left: "62%",
      color: PARTICLE_COLORS[3],
      delay: "175ms",
      translateY: "-105px",
      rotate: "-40deg",
    },
    {
      left: "70%",
      color: PARTICLE_COLORS[0],
      delay: "250ms",
      translateY: "-85px",
      rotate: "55deg",
    },
    {
      left: "78%",
      color: PARTICLE_COLORS[1],
      delay: "300ms",
      translateY: "-115px",
      rotate: "-15deg",
    },
    {
      left: "86%",
      color: PARTICLE_COLORS[2],
      delay: "350ms",
      translateY: "-65px",
      rotate: "70deg",
    },
    {
      left: "94%",
      color: PARTICLE_COLORS[3],
      delay: "400ms",
      translateY: "-95px",
      rotate: "-60deg",
    },
  ];

  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        {STEPS.map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: i + 1 <= step ? PRIMARY : MUTED,
              transition: "color 0.3s",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      {/* Celebration particles — absolutely positioned above progress bar */}
      <div style={{ position: "relative" }}>
        {showCelebration &&
          particles.map((p) => (
            <div
              key={`particle-${p.left}-${p.delay}`}
              style={{
                position: "absolute",
                bottom: "100%",
                left: p.left,
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: p.color,
                animationName: "imperido-celebrate-particle",
                animationDuration: "900ms",
                animationDelay: p.delay,
                animationTimingFunction: "ease-out",
                animationFillMode: "forwards",
                pointerEvents: "none",
                zIndex: 10,
                // Store custom props via style for the keyframe end state
                // Each particle uses unique translateY and rotation inline
              }}
            />
          ))}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px",
          }}
        >
          {STEPS.map((label, idx) => {
            const remaining = STEPS.length - (idx + 1);
            const tooltipText =
              remaining > 0
                ? `${remaining} step${remaining === 1 ? "" : "s"} remaining`
                : "Last step";
            return (
              <div
                key={label}
                style={{ position: "relative" }}
                className="group"
              >
                {/* Tooltip — appears above the bar segment on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out delay-75 pointer-events-none z-50">
                  {tooltipText}
                </div>
                {/* Bar segment */}
                <div
                  title={tooltipText}
                  style={{
                    height: "4px",
                    borderRadius: "2px",
                    background: idx + 1 <= step ? PRIMARY : BORDER,
                    transition: "background 0.4s ease",
                    ...(idx + 1 === step
                      ? {
                          animation:
                            "imperido-pulse-glow 2s ease-in-out infinite",
                        }
                      : {}),
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* "Almost there! Last step." message — fades in when on last step */}
      <div
        style={{
          marginTop: "12px",
          textAlign: "center",
          opacity: step === STEPS.length ? 1 : 0,
          transition: "opacity 300ms ease",
          pointerEvents: "none",
          height: step === STEPS.length ? "auto" : "0",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            color: PRIMARY,
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            textShadow: "0 0 8px rgba(94,240,138,0.5)",
          }}
        >
          Almost there! Last step.
        </span>
      </div>
    </div>
  );
}

interface CartState {
  productName?: string;
  basePrice?: number;
  rushFee?: number;
  hostingPrice?: number;
  hostingLabel?: string;
  aiUpsell?: boolean;
  depositAmount?: number;
  monthlyAmount?: number;
}

function SelectedPackageBanner({ cart }: { cart: CartState }) {
  if (!cart.productName) return null;
  const buildTotal = (cart.basePrice ?? 0) + (cart.rushFee ?? 0);
  return (
    <div
      data-ocid="intake.selected_package.card"
      style={{
        background: "rgba(17,19,34,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid #5EF08A",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      <p
        style={{
          color: TEXT,
          fontWeight: 700,
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: "10px",
        }}
      >
        Selected Package
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: TEXT, fontWeight: 700, fontSize: "15px" }}>
            {cart.productName}
          </span>
          <span style={{ color: PRIMARY, fontWeight: 700, fontSize: "15px" }}>
            ${buildTotal.toLocaleString()}
          </span>
        </div>
        {(cart.rushFee ?? 0) > 0 && (
          <p style={{ color: MUTED, fontSize: "12px" }}>
            Includes rush fee: +${(cart.rushFee ?? 0).toLocaleString()}
          </p>
        )}
        {(cart.depositAmount ?? 0) > 0 && (
          <p style={{ color: PRIMARY, fontSize: "13px", fontWeight: 600 }}>
            Due Today: ${(cart.depositAmount ?? 0).toLocaleString()} — 50%
            deposit
          </p>
        )}
        {(cart.monthlyAmount ?? 0) > 0 && (
          <p style={{ color: MUTED, fontSize: "12px" }}>
            Monthly after launch: ${cart.monthlyAmount}/mo
            {cart.aiUpsell && " (incl. AI Receptionist)"}
          </p>
        )}
      </div>
    </div>
  );
}

function Step1({
  errors,
  cart,
}: {
  errors: Record<string, string>;
  cart: CartState;
}) {
  const { serviceType, setField } = useIntakeStore();
  return (
    <div>
      <SelectedPackageBanner cart={cart} />
      <h2
        style={{
          color: "#5EF08A",
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "8px",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        }}
      >
        <TypewriterText text="What are we building?" as="span" speed={45} />
      </h2>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>
        Select the service that best fits your goals.
      </p>
      <div
        className="intake-service-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(1, 1fr)",
          gap: "12px",
        }}
      >
        <style>
          {
            "@media (min-width: 400px) { .intake-service-grid { grid-template-columns: repeat(2, 1fr) !important; } }"
          }
        </style>
        {SERVICE_OPTIONS.map(({ id, label, icon: Icon, desc }) => {
          const selected = serviceType === id;
          return (
            <button
              key={id}
              type="button"
              data-ocid={`intake.service.${id}.card`}
              onClick={() => setField("serviceType", id)}
              style={{
                background: selected
                  ? "rgba(57,255,20,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: selected
                  ? "2px solid #39FF14"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: selected ? "23px 15px" : "24px 16px",
                cursor: "pointer",
                textAlign: "left",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: selected
                  ? "0 0 0 1px #39FF14, 0 8px 32px rgba(57,255,20,0.25), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(-6px)";
                  el.style.background = "rgba(57,255,20,0.04)";
                  el.style.boxShadow =
                    "0 8px 32px rgba(57,255,20,0.15), 0 0 0 1px rgba(57,255,20,0.2), inset 0 1px 0 rgba(255,255,255,0.07)";
                  el.style.borderColor = "rgba(57,255,20,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(0)";
                  el.style.background = "rgba(255,255,255,0.03)";
                  el.style.boxShadow =
                    "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)";
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                }
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: selected
                    ? "rgba(57,255,20,0.15)"
                    : "rgba(57,255,20,0.08)",
                  border: selected
                    ? "1px solid rgba(57,255,20,0.4)"
                    : "1px solid rgba(57,255,20,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                  transition: "background 0.3s, border-color 0.3s",
                  flexShrink: 0,
                }}
              >
                <Icon size={24} color="#39FF14" strokeWidth={1.75} />
              </div>
              <p
                style={{
                  color: "#5EF08A",
                  fontWeight: 700,
                  fontSize: "14px",
                  marginBottom: "5px",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                }}
              >
                <TypewriterText text={label} as="span" speed={30} />
              </p>
              <p
                style={{ color: "#7A7D90", fontSize: "12px", lineHeight: 1.5 }}
              >
                <TypewriterText text={desc} as="span" speed={25} />
              </p>
            </button>
          );
        })}
      </div>
      <ErrorMsg msg={errors.serviceType} />
    </div>
  );
}

function Step2({ errors }: { errors: Record<string, string> }) {
  const { businessName, industry, monthlyRevenue, websiteUrl, setField } =
    useIntakeStore();
  return (
    <div>
      <h2
        style={{
          color: "#5EF08A",
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "8px",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        }}
      >
        <TypewriterText text="Your Business" as="span" speed={45} />
      </h2>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>
        Tell us about what you do.
      </p>
      <div style={fieldWrap}>
        <label htmlFor="intake-businessName" style={labelStyle}>
          Business Name *
        </label>
        <input
          id="intake-businessName"
          data-ocid="intake.businessName.input"
          style={inputStyle}
          type="text"
          placeholder="Acme Corp"
          value={businessName}
          onChange={(e) => setField("businessName", e.target.value)}
        />
        <ErrorMsg msg={errors.businessName} />
      </div>
      <div style={fieldWrap}>
        <label htmlFor="intake-industry" style={labelStyle}>
          Industry *
        </label>
        <select
          id="intake-industry"
          data-ocid="intake.industry.select"
          style={selectStyle}
          value={industry}
          onChange={(e) => setField("industry", e.target.value)}
        >
          <option value="" disabled>
            Select industry...
          </option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind} style={{ background: INPUT_BG }}>
              {ind}
            </option>
          ))}
        </select>
        <ErrorMsg msg={errors.industry} />
      </div>
      <div style={fieldWrap}>
        <label htmlFor="intake-revenue" style={labelStyle}>
          Monthly Revenue *
        </label>
        <select
          id="intake-revenue"
          data-ocid="intake.monthlyRevenue.select"
          style={selectStyle}
          value={monthlyRevenue}
          onChange={(e) => setField("monthlyRevenue", e.target.value)}
        >
          <option value="" disabled>
            Select range...
          </option>
          {REVENUE_OPTIONS.map((r) => (
            <option key={r} value={r} style={{ background: INPUT_BG }}>
              {r}
            </option>
          ))}
        </select>
        <ErrorMsg msg={errors.monthlyRevenue} />
      </div>
      <div style={fieldWrap}>
        <label htmlFor="intake-websiteUrl" style={labelStyle}>
          Current Website URL{" "}
          <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          id="intake-websiteUrl"
          data-ocid="intake.websiteUrl.input"
          style={inputStyle}
          type="url"
          placeholder="https://..."
          value={websiteUrl}
          onChange={(e) => setField("websiteUrl", e.target.value)}
        />
      </div>
    </div>
  );
}

function Step3({ errors }: { errors: Record<string, string> }) {
  const { fullName, email, phone, bestTime, setField } = useIntakeStore();

  return (
    <div>
      <h2
        style={{
          color: "#5EF08A",
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "8px",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        }}
      >
        <TypewriterText text="Contact" as="span" speed={45} />
      </h2>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>
        How should we reach you?
      </p>

      {/* Contact fields */}
      <div>
        <div style={fieldWrap}>
          <label htmlFor="intake-fullName" style={labelStyle}>
            Full Name *
          </label>
          <input
            id="intake-fullName"
            data-ocid="intake.fullName.input"
            style={inputStyle}
            type="text"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setField("fullName", e.target.value)}
          />
          <ErrorMsg msg={errors.fullName} />
        </div>
        <div style={fieldWrap}>
          <label htmlFor="intake-email" style={labelStyle}>
            Email *
          </label>
          <input
            id="intake-email"
            data-ocid="intake.email.input"
            style={inputStyle}
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setField("email", e.target.value)}
          />
          <ErrorMsg msg={errors.email} />
        </div>
        <div style={fieldWrap}>
          <label htmlFor="intake-phone" style={labelStyle}>
            Phone *
          </label>
          <input
            id="intake-phone"
            data-ocid="intake.phone.input"
            style={inputStyle}
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
          <ErrorMsg msg={errors.phone} />
        </div>
        <div style={fieldWrap}>
          <label htmlFor="intake-bestTime" style={labelStyle}>
            Best Time to Contact
          </label>
          <select
            id="intake-bestTime"
            data-ocid="intake.bestTime.select"
            style={selectStyle}
            value={bestTime}
            onChange={(e) => setField("bestTime", e.target.value)}
          >
            <option value="">Select a time...</option>
            {BEST_TIMES.map((t) => (
              <option key={t} value={t} style={{ background: INPUT_BG }}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Step4() {
  const {
    serviceType,
    businessName,
    industry,
    websiteUrl,
    fullName,
    email,
    phone,
    reset,
  } = useIntakeStore();
  const { actor } = useActor();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const serviceLabel =
    SERVICE_OPTIONS.find((s) => s.id === serviceType)?.label ?? serviceType;

  async function handleBookCall() {
    if (!actor) {
      setSubmitError("Connection unavailable. Please try again.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = JSON.stringify({
        contact_name: fullName,
        contact_phone: phone,
        business_type: industry,
        website: websiteUrl,
      });
      try {
        await (
          actor as unknown as {
            createLead: (
              path: string,
              name: string,
              email: string,
              business: string,
              message: string,
            ) => Promise<string>;
          }
        ).createLead("/intake", fullName, email, businessName, payload);
      } catch (error: unknown) {
        setSubmitting(false);
        setSubmitError(
          "Something went wrong submitting your inquiry. Please try again or contact us directly.",
        );
        console.error("submitInquiry failed:", error);
        return;
      }
      setSubmitted(true);
      // Feature 3: Send confirmation email to client (fail silently)
      try {
        const svcLabel =
          SERVICE_OPTIONS.find((s) => s.id === serviceType)?.label ??
          serviceType;
        await (actor as unknown as backendInterface).helpRequest(
          fullName,
          email,
          "We received your inquiry — Imperidome will be in touch shortly",
          `Hi ${fullName},\n\nThank you for reaching out about ${svcLabel}. We've received your inquiry and our team will review it and follow up with you within 1 business day.\n\nIf you have any additional details to share, please feel free to reply to this email.\n\nWe look forward to speaking with you.\n\nWarm regards,\nThe Imperidome Team`,
          "normal",
          "",
          "",
        );
      } catch (error) {
        console.error("Intake confirmation email failed:", error);
      }
    } catch {
      setSubmitError(
        "Something went wrong. Please try again or contact us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(94,240,138,0.15)",
            border: `2px solid ${PRIMARY}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 30px rgba(94,240,138,0.2)",
          }}
        >
          <CheckCircle size={40} color={PRIMARY} />
        </div>
        <h2
          style={{
            color: "#5EF08A",
            fontSize: "26px",
            fontWeight: 700,
            marginBottom: "8px",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          }}
        >
          <TypewriterText text="Booking Confirmed!" as="span" speed={50} />
        </h2>
        <p style={{ color: MUTED, fontSize: "15px", marginBottom: "24px" }}>
          We&apos;ll be in touch within 24 hours to confirm your call details.
        </p>
        <p style={{ color: MUTED, fontSize: "13px" }}>
          A confirmation has been sent to{" "}
          <span style={{ color: TEXT, fontWeight: 600 }}>{email}</span>.
        </p>
        <button
          type="button"
          data-ocid="intake.start_over.button"
          onClick={() => {
            reset();
          }}
          style={{
            marginTop: "28px",
            background: "transparent",
            border: `1px solid ${BORDER}`,
            color: MUTED,
            borderRadius: "8px",
            padding: "8px 20px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Start a new inquiry
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(94,240,138,0.15)",
          border: `2px solid ${PRIMARY}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 0 30px rgba(94,240,138,0.2)",
        }}
      >
        <CheckCircle size={40} color={PRIMARY} />
      </div>
      <h2
        style={{
          color: "#5EF08A",
          fontSize: "26px",
          fontWeight: 700,
          marginBottom: "8px",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        }}
      >
        <TypewriterText text="Brief Submitted" as="span" speed={50} />
      </h2>
      <p style={{ color: MUTED, fontSize: "15px", marginBottom: "32px" }}>
        We&apos;ll be in touch within 24 hours.
      </p>
      <div
        style={{
          background: "rgba(19,21,36,0.8)",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "20px 24px",
          textAlign: "left",
          marginBottom: "28px",
        }}
      >
        <p
          style={{
            color: MUTED,
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "14px",
          }}
        >
          Summary
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: MUTED, fontSize: "13px" }}>Service</span>
            <span style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>
              {serviceLabel}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: MUTED, fontSize: "13px" }}>Business</span>
            <span style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>
              {businessName}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: MUTED, fontSize: "13px" }}>Email</span>
            <span style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>
              {email}
            </span>
          </div>
        </div>
      </div>

      {submitError && (
        <p
          data-ocid="intake.submit.error_state"
          style={{
            color: "#F87171",
            fontSize: "13px",
            marginBottom: "16px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "8px",
            padding: "10px 14px",
          }}
        >
          {submitError}
        </p>
      )}

      <button
        type="button"
        data-ocid="intake.book_call.button"
        onClick={handleBookCall}
        disabled={submitting}
        style={{
          display: "block",
          width: "100%",
          background: submitting ? "rgba(94,240,138,0.5)" : PRIMARY,
          color: BTN_DARK,
          fontWeight: 700,
          fontSize: "15px",
          padding: "14px 24px",
          borderRadius: "10px",
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
          textAlign: "center",
          letterSpacing: "0.02em",
          boxShadow: submitting ? "none" : "0 4px 20px rgba(94,240,138,0.25)",
          transition: "all 0.2s",
        }}
      >
        {submitting ? "Sending…" : "Book Discovery Call"}
      </button>
    </div>
  );
}

// Celebration particle colors matching brand palette
const PARTICLE_COLORS = ["#5EF08A", "#39FF14", "#FFFFFF", "#94F0B4"];

export default function IntakePage() {
  const { step, nextStep, prevStep, setField } = useIntakeStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const routerState = useRouterState();
  const locationState = (routerState.location.state ?? {}) as CartState;
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationFiredRef = useRef(false);

  // ── Celebration on reaching last step ─────────────────────────────────────
  useEffect(() => {
    const TOTAL = STEPS.length;
    if (step === TOTAL) {
      if (!celebrationFiredRef.current) {
        celebrationFiredRef.current = true;
        setShowCelebration(true);
        const timer = setTimeout(() => {
          setShowCelebration(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset so celebration can fire again if user navigates back and returns
      celebrationFiredRef.current = false;
      setShowCelebration(false);
    }
  }, [step]);

  // ── URL param pre-selection ───────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    const validIds = [
      "custom",
      "speedy",
      "ai-receptionist",
      "cinematic",
      "product-ads",
      "audit",
      "consultation",
    ];
    if (service && validIds.includes(service)) {
      setField("serviceType", service);
      useIntakeStore.setState({ step: 2 });
    }
  }, [setField]);

  // ── Visit tracking ────────────────────────────────────────────────────────

  useEffect(() => {
    const track = async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        const countryCode: string | null = null;
        const publicActor = await createActorWithConfig(createActor);
        await (publicActor as backendInterface).recordVisit(
          window.location.pathname,
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid!,
          countryCode,
        );
      } catch {
        // silent
      }
    };
    track();
  }, []);

  function validate(): boolean {
    const store = useIntakeStore.getState();
    const errs: Record<string, string> = {};
    if (step === 1 && !store.serviceType)
      errs.serviceType = "Please select a service.";
    if (step === 2) {
      if (!store.businessName.trim())
        errs.businessName = "Business name is required.";
      if (!store.industry) errs.industry = "Please select an industry.";
      if (!store.monthlyRevenue)
        errs.monthlyRevenue = "Please select a revenue range.";
    }
    if (step === 3) {
      if (!store.fullName.trim()) errs.fullName = "Full name is required.";
      if (!store.email.trim()) errs.email = "Email is required.";
      if (!store.phone.trim()) errs.phone = "Phone is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) nextStep();
  }

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(16px, 4vw, 40px) 16px",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "fixed",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(94,240,138,0.06), transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Logo */}
        <a
          href="/"
          style={{
            color: PRIMARY,
            fontWeight: 800,
            fontSize: "20px",
            letterSpacing: "0.1em",
            textDecoration: "none",
            marginBottom: "32px",
            zIndex: 1,
          }}
        >
          IMPERIDOME
        </a>

        {/* Card */}
        <div
          data-ocid="intake.panel"
          style={{
            width: "100%",
            maxWidth: "640px",
            background: CARD,
            backdropFilter: "blur(12px)",
            border: `1px solid ${BORDER}`,
            borderRadius: "16px",
            padding: "clamp(24px, 5vw, 48px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <ProgressBar step={step} showCelebration={showCelebration} />

          <div
            key={step}
            style={{ animation: "fadeSlideIn 0.3s ease forwards" }}
          >
            {step === 1 && <Step1 errors={errors} cart={locationState} />}
            {step === 2 && <Step2 errors={errors} />}
            {step === 3 && <Step3 errors={errors} />}
            {step === 4 && <Step4 />}
          </div>

          {step < 4 && (
            <div
              style={{
                display: "flex",
                justifyContent: step > 1 ? "space-between" : "flex-end",
                alignItems: "center",
                marginTop: "32px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {step > 1 && (
                <button
                  type="button"
                  data-ocid="intake.back.button"
                  onClick={prevStep}
                  style={{
                    background: "transparent",
                    border: `1px solid ${BORDER}`,
                    color: TEXT,
                    borderRadius: "10px",
                    padding: "10px 24px",
                    minHeight: "44px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}
              <button
                type="button"
                data-ocid="intake.next.button"
                onClick={handleNext}
                style={{
                  background: PRIMARY,
                  color: BTN_DARK,
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 16px rgba(94,240,138,0.2)",
                  transition: "opacity 0.2s",
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <style>{`
        @keyframes imperido-pulse-glow {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(94,240,138,0.0); }
          50% { box-shadow: 0 0 10px 4px rgba(94,240,138,0.6); }
        }
        @keyframes imperido-celebrate-particle {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          60%  { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-90px) rotate(60deg) scale(0.5); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #7A7D90; }
        select option { background: #131524; color: #EEF0F8; }
        input:focus, select:focus { border-color: #5EF08A !important; outline: none; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) sepia(1) saturate(3) hue-rotate(90deg);
          cursor: pointer;
          opacity: 0.7;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      </div>
      <Footer />
    </>
  );
}
