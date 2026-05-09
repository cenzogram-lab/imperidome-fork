import { useRouterState } from "@tanstack/react-router";
import {
  Bot,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Globe,
  Loader2,
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
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";

// ─── Availability types ───────────────────────────────────────────────────────
type DaySchedule = { isOpen: boolean; startHour: number; endHour: number };
type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};
type AvailabilitySettings = {
  weeklySchedule: WeeklySchedule;
  blockedDates: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDayKey(date: Date): keyof WeeklySchedule {
  const days: (keyof WeeklySchedule)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[date.getDay()];
}

function isDateAvailable(settings: AvailabilitySettings, date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return false;
  const iso = toLocalISODate(date);
  if (settings.blockedDates.includes(iso)) return false;
  const dayKey = getDayKey(date);
  return settings.weeklySchedule[dayKey].isOpen;
}

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 2-hour buffer: slot is available only if it's at least 2 hours from now
function getAvailableSlots(
  settings: AvailabilitySettings,
  selectedDate: Date,
): string[] {
  const dayKey = getDayKey(selectedDate);
  const schedule = settings.weeklySchedule[dayKey];
  if (!schedule.isOpen) return [];

  const slots: string[] = [];
  const now = new Date();
  const isToday = toLocalISODate(selectedDate) === toLocalISODate(now);
  const bufferHour = now.getHours() + 2; // 2-hour buffer

  for (let h = schedule.startHour; h < schedule.endHour; h++) {
    if (isToday && h <= bufferHour) continue;
    const period = h < 12 ? "AM" : "PM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push(`${display}:00 ${period}`);
  }
  return slots;
}

function formatHour24(slot: string): string {
  // Converts "9:00 AM" → "09:00" for the message payload
  const [timePart, period] = slot.split(" ");
  let [h] = timePart.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:00`;
}

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
  preferredDate: string;
  preferredSlot: string;
  meetingMethod: "phone" | "google_meet";
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
  preferredDate: "",
  preferredSlot: "",
  meetingMethod: "phone",
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
      preferredDate: "",
      preferredSlot: "",
      meetingMethod: "phone",
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

function ProgressBar({ step }: { step: number }) {
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "6px",
        }}
      >
        {STEPS.map((label) => {
          const idx = STEPS.indexOf(label);
          return (
            <div
              key={label}
              style={{
                height: "4px",
                borderRadius: "2px",
                background: idx + 1 <= step ? PRIMARY : BORDER,
                transition: "background 0.4s ease",
              }}
            />
          );
        })}
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
          color: TEXT,
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        What are we building?
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
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: "14px",
                  marginBottom: "5px",
                }}
              >
                {label}
              </p>
              <p
                style={{ color: "#7A7D90", fontSize: "12px", lineHeight: 1.5 }}
              >
                {desc}
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
          color: TEXT,
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        Your Business
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

// ─── Date/Time picker sub-component used in Step 3 ───────────────────────────
function DateTimePicker({
  availability,
  preferredDate,
  preferredSlot,
  onDateChange,
  onSlotChange,
}: {
  availability: AvailabilitySettings | null;
  preferredDate: string;
  preferredSlot: string;
  onDateChange: (d: string) => void;
  onSlotChange: (s: string) => void;
}) {
  const todayISO = toLocalISODate(new Date());

  // Available slots for the currently selected date
  const slots: string[] = (() => {
    if (!availability || !preferredDate) return [];
    const d = new Date(`${preferredDate}T12:00:00`); // noon to avoid DST issues
    return getAvailableSlots(availability, d);
  })();

  // When date changes, clear slot if it's no longer in the new list
  function handleDateChange(iso: string) {
    onDateChange(iso);
    onSlotChange("");
  }

  // Custom date validation: grey-out unavailable dates via native min +
  // a browser-side check on the date input's change event.
  function handleNativeDateChange(iso: string) {
    if (!availability) {
      handleDateChange(iso);
      return;
    }
    const d = new Date(`${iso}T12:00:00`);
    if (!isDateAvailable(availability, d)) {
      // Silently reject — keep the previous value
      return;
    }
    handleDateChange(iso);
  }

  const hasAvailability = availability !== null;
  const noSlotsForDay = hasAvailability && preferredDate && slots.length === 0;

  return (
    <div
      style={{
        background: "rgba(19,21,36,0.6)",
        border: `1px solid ${BORDER}`,
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "18px",
        }}
      >
        <CalendarDays size={18} color={PRIMARY} />
        <span
          style={{
            color: TEXT,
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Preferred Date &amp; Time
        </span>
        <span
          style={{
            color: MUTED,
            fontSize: "12px",
            marginLeft: "4px",
          }}
        >
          (optional)
        </span>
      </div>

      {/* Date input */}
      <div style={{ marginBottom: preferredDate ? "18px" : "0" }}>
        <label
          htmlFor="intake-preferred-date"
          style={{ ...labelStyle, marginBottom: "8px" }}
        >
          Select a date
        </label>
        <input
          id="intake-preferred-date"
          data-ocid="intake.preferredDate.input"
          type="date"
          min={todayISO}
          value={preferredDate}
          onChange={(e) => handleNativeDateChange(e.target.value)}
          style={{
            ...inputStyle,
            colorScheme: "dark",
            cursor: "pointer",
          }}
        />
        {hasAvailability && preferredDate && (
          <p
            style={{
              fontSize: "11px",
              color: noSlotsForDay ? "#F87171" : MUTED,
              marginTop: "5px",
            }}
          >
            {noSlotsForDay
              ? "This day is unavailable. Please choose another date."
              : `${slots.length} slot${slots.length === 1 ? "" : "s"} available`}
          </p>
        )}
      </div>

      {/* Time slots */}
      {preferredDate && slots.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            <Clock size={14} color={MUTED} />
            <span style={{ color: MUTED, fontSize: "12px", fontWeight: 500 }}>
              Available times
            </span>
          </div>
          <div
            data-ocid="intake.timeSlots.grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: "8px",
            }}
          >
            {slots.map((slot) => {
              const selected = preferredSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  data-ocid={`intake.timeSlot.${slot.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.button`}
                  onClick={() => onSlotChange(selected ? "" : slot)}
                  style={{
                    background: selected
                      ? "rgba(94,240,138,0.18)"
                      : "rgba(255,255,255,0.04)",
                    border: selected
                      ? `1.5px solid ${PRIMARY}`
                      : `1px solid ${BORDER}`,
                    borderRadius: "8px",
                    padding: "9px 6px",
                    color: selected ? PRIMARY : TEXT,
                    fontSize: "13px",
                    fontWeight: selected ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    boxShadow: selected
                      ? "0 0 10px rgba(94,240,138,0.2)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor =
                        "rgba(94,240,138,0.4)";
                      e.currentTarget.style.background =
                        "rgba(94,240,138,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.borderColor = BORDER;
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                    }
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Step3({
  errors,
  availability,
  actor: actorProp,
}: {
  errors: Record<string, string>;
  availability: AvailabilitySettings | null;
  actor: ReturnType<typeof useActor>["actor"];
}) {
  const {
    fullName,
    email,
    phone,
    bestTime,
    preferredDate,
    preferredSlot,
    meetingMethod,
    setField,
  } = useIntakeStore();

  // Quick Book state
  const [quickBookLoading, setQuickBookLoading] = useState(false);
  const [quickBookToast, setQuickBookToast] = useState("");
  const contactSectionRef = useRef<HTMLDivElement>(null);

  async function handleQuickBook() {
    if (!actorProp) return;
    setQuickBookLoading(true);
    setQuickBookToast("");
    try {
      const result = await (
        actorProp as unknown as {
          getNextAvailableSlot: () => Promise<{ date: string; time: string }>;
        }
      ).getNextAvailableSlot();

      if (!result.date || !result.time) {
        setQuickBookToast(
          "No slots available in the next 60 days. Please check back later.",
        );
        return;
      }

      setField("preferredDate", result.date);
      setField("preferredSlot", result.time);

      // Scroll to contact fields
      setTimeout(() => {
        contactSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    } catch {
      setQuickBookToast(
        "Could not fetch next available slot. Please try manually.",
      );
    } finally {
      setQuickBookLoading(false);
    }
  }

  return (
    <div>
      <h2
        style={{
          color: TEXT,
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        Contact
      </h2>
      <p style={{ color: MUTED, fontSize: "14px", marginBottom: "28px" }}>
        How should we reach you?
      </p>

      {/* Quick Book CTA */}
      <div style={{ marginBottom: "24px" }}>
        <button
          type="button"
          data-ocid="intake.quick_book.button"
          onClick={handleQuickBook}
          disabled={quickBookLoading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background: quickBookLoading
              ? "rgba(94,240,138,0.08)"
              : "rgba(94,240,138,0.10)",
            border: `1.5px solid ${quickBookLoading ? "rgba(94,240,138,0.25)" : "rgba(94,240,138,0.45)"}`,
            borderRadius: "12px",
            padding: "13px 20px",
            cursor: quickBookLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: quickBookLoading
              ? "none"
              : "0 0 20px rgba(94,240,138,0.12)",
          }}
          onMouseEnter={(e) => {
            if (!quickBookLoading) {
              e.currentTarget.style.background = "rgba(94,240,138,0.16)";
              e.currentTarget.style.boxShadow = "0 0 28px rgba(94,240,138,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!quickBookLoading) {
              e.currentTarget.style.background = "rgba(94,240,138,0.10)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(94,240,138,0.12)";
            }
          }}
        >
          {quickBookLoading ? (
            <Loader2
              size={18}
              color={PRIMARY}
              style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
            />
          ) : (
            <span style={{ fontSize: "18px" }}>⚡</span>
          )}
          <div style={{ textAlign: "left" }}>
            <p
              style={{
                color: PRIMARY,
                fontWeight: 700,
                fontSize: "14px",
                margin: 0,
              }}
            >
              {quickBookLoading
                ? "Finding next slot…"
                : "Quick Book — Next Available Slot"}
            </p>
            <p
              style={{
                color: MUTED,
                fontSize: "12px",
                margin: "2px 0 0",
              }}
            >
              Auto-selects the earliest open time
            </p>
          </div>
        </button>

        {/* Toast feedback */}
        {quickBookToast && (
          <p
            data-ocid="intake.quick_book.toast"
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#F87171",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          >
            {quickBookToast}
          </p>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: BORDER }} />
        <span style={{ color: MUTED, fontSize: "11px", fontWeight: 600 }}>
          OR PICK MANUALLY
        </span>
        <div style={{ flex: 1, height: "1px", background: BORDER }} />
      </div>

      {/* Contact fields */}
      <div ref={contactSectionRef}>
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

      {/* Date & time picker */}
      <DateTimePicker
        availability={availability}
        preferredDate={preferredDate}
        preferredSlot={preferredSlot}
        onDateChange={(d) => setField("preferredDate", d)}
        onSlotChange={(s) => setField("preferredSlot", s)}
      />

      {/* Meeting Method toggle */}
      <div style={{ marginBottom: "8px" }}>
        <p
          style={{
            ...labelStyle,
            marginBottom: "10px",
          }}
        >
          Meeting Method
        </p>
        <div
          data-ocid="intake.meetingMethod.toggle"
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            data-ocid="intake.meetingMethod.phone.button"
            onClick={() => setField("meetingMethod", "phone")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "10px",
              border:
                meetingMethod === "phone"
                  ? "2px solid #F97316"
                  : `1px solid ${BORDER}`,
              background:
                meetingMethod === "phone"
                  ? "rgba(249,115,22,0.12)"
                  : "rgba(255,255,255,0.03)",
              color: meetingMethod === "phone" ? "#F97316" : TEXT,
              fontWeight: meetingMethod === "phone" ? 700 : 500,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              boxShadow:
                meetingMethod === "phone"
                  ? "0 0 14px rgba(249,115,22,0.2)"
                  : "none",
            }}
          >
            <span style={{ fontSize: "16px" }}>📞</span>
            Phone Call
          </button>
          <button
            type="button"
            data-ocid="intake.meetingMethod.google_meet.button"
            onClick={() => setField("meetingMethod", "google_meet")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "10px",
              border:
                meetingMethod === "google_meet"
                  ? "2px solid #3B82F6"
                  : `1px solid ${BORDER}`,
              background:
                meetingMethod === "google_meet"
                  ? "rgba(59,130,246,0.12)"
                  : "rgba(255,255,255,0.03)",
              color: meetingMethod === "google_meet" ? "#3B82F6" : TEXT,
              fontWeight: meetingMethod === "google_meet" ? 700 : 500,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              boxShadow:
                meetingMethod === "google_meet"
                  ? "0 0 14px rgba(59,130,246,0.2)"
                  : "none",
            }}
          >
            <span style={{ fontSize: "16px" }}>📹</span>
            Google Meet
          </button>
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
    preferredDate,
    preferredSlot,
    meetingMethod,
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
        preferred_date: preferredDate,
        preferred_time: preferredSlot ? formatHour24(preferredSlot) : "",
        website: websiteUrl,
        meetingMethod,
      });
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
      setSubmitted(true);
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
            color: TEXT,
            fontSize: "26px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Booking Confirmed!
        </h2>
        <p style={{ color: MUTED, fontSize: "15px", marginBottom: "24px" }}>
          We&apos;ll be in touch within 24 hours to confirm your
          {meetingMethod === "google_meet"
            ? " Google Meet link"
            : " call details"}
          .
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
          color: TEXT,
          fontSize: "26px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        Brief Submitted
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
          {preferredDate && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: MUTED, fontSize: "13px" }}>Booking</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <span
                  style={{
                    color: PRIMARY,
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {preferredDate}
                  {preferredSlot ? ` at ${preferredSlot}` : ""}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background:
                      meetingMethod === "phone"
                        ? "rgba(249,115,22,0.15)"
                        : "rgba(59,130,246,0.15)",
                    color: meetingMethod === "phone" ? "#F97316" : "#3B82F6",
                    border:
                      meetingMethod === "phone"
                        ? "1px solid rgba(249,115,22,0.35)"
                        : "1px solid rgba(59,130,246,0.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {meetingMethod === "phone"
                    ? "📞 Phone Call"
                    : "📹 Google Meet"}
                </span>
              </div>
            </div>
          )}
          {!preferredDate && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: MUTED, fontSize: "13px" }}>Method</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "20px",
                  background:
                    meetingMethod === "phone"
                      ? "rgba(249,115,22,0.15)"
                      : "rgba(59,130,246,0.15)",
                  color: meetingMethod === "phone" ? "#F97316" : "#3B82F6",
                  border:
                    meetingMethod === "phone"
                      ? "1px solid rgba(249,115,22,0.35)"
                      : "1px solid rgba(59,130,246,0.35)",
                  whiteSpace: "nowrap",
                }}
              >
                {meetingMethod === "phone" ? "📞 Phone Call" : "📹 Google Meet"}
              </span>
            </div>
          )}
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

export default function IntakePage() {
  const { step, nextStep, prevStep } = useIntakeStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const routerState = useRouterState();
  const locationState = (routerState.location.state ?? {}) as CartState;

  // ── Visit tracking ────────────────────────────────────────────────────────
  const { actor, isFetching } = useActor();
  useEffect(() => {
    const track = async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        let countryCode: string | null = null;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2000);
          const res = await fetch("https://ipapi.co/country/", {
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          const text = (await res.text()).trim();
          if (/^[A-Z]{2}$/.test(text)) countryCode = text;
        } catch {
          // geolocation failed — use null
        }
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

  // ── Availability fetch ──────────────────────────────────────────────────────
  const [availability, setAvailability] = useState<AvailabilitySettings | null>(
    null,
  );

  useEffect(() => {
    if (!actor || isFetching) return;
    (actor as backendInterface)
      .getAvailability()
      .then((result) => {
        if (result) {
          // Map bigint hour fields from backend to local number type
          const days = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ] as const;
          const mapped: AvailabilitySettings = {
            blockedDates: result.blockedDates,
            weeklySchedule: Object.fromEntries(
              days.map((d) => [
                d,
                {
                  isOpen: result.weeklySchedule[d].isOpen,
                  startHour: Number(result.weeklySchedule[d].startHour),
                  endHour: Number(result.weeklySchedule[d].endHour),
                },
              ]),
            ) as WeeklySchedule,
          };
          setAvailability(mapped);
        }
      })
      .catch(() => {
        // Non-blocking — date/time picker still renders without availability gating
      });
  }, [actor, isFetching]);

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
    if (step === 3) {
      // Before advancing, append date/time to bestTime field so it travels with the lead
      const store = useIntakeStore.getState();
      if (store.preferredDate) {
        const timeStr = store.preferredSlot
          ? formatHour24(store.preferredSlot)
          : "";
        const suffix = timeStr
          ? ` | Preferred date: ${store.preferredDate}, time: ${timeStr}`
          : ` | Preferred date: ${store.preferredDate}`;
        // Only append if not already present
        if (!store.bestTime.includes("Preferred date:")) {
          useIntakeStore
            .getState()
            .setField(
              "bestTime",
              (store.bestTime ? store.bestTime : "Anytime") + suffix,
            );
        }
      }
    }
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
          <ProgressBar step={step} />

          <div
            key={step}
            style={{ animation: "fadeSlideIn 0.3s ease forwards" }}
          >
            {step === 1 && <Step1 errors={errors} cart={locationState} />}
            {step === 2 && <Step2 errors={errors} />}
            {step === 3 && (
              <Step3
                errors={errors}
                availability={availability}
                actor={actor}
              />
            )}
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
