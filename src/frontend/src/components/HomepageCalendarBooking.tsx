import {
  ArrowLeft,
  Bot,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Globe,
  MessageSquare,
  Phone,
  Search,
  ShoppingCart,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { AvailabilitySettings } from "../backend";
import { useActor } from "../hooks/useActor";

// ─── Constants ────────────────────────────────────────────────────────────────
const BG = "#0A0B14";
const CARD_BG = "rgba(17,19,34,0.85)";
const GREEN = "#39FF14";
const BORDER = "1px solid #1C1F33";
const GREEN_BORDER = "1px solid rgba(57,255,20,0.35)";
const MUTED = "rgba(156,163,175,0.75)";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const STEPS = [
  "Select Date",
  "Select Time",
  "Meeting Type",
  "Your Details",
] as const;
type Step = 0 | 1 | 2 | 3;

type MeetingMethod = "phone" | "google_meet";

interface FormState {
  name: string;
  email: string;
  phone: string;
  business: string;
  serviceType: string;
  businessName: string;
  industry: string;
  monthlyRevenue: string;
  websiteUrl: string;
  bestTime: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDate(y: number, m: number, d: number) {
  return new Date(y, m, d);
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeLabel(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0",
        marginBottom: "24px",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  border:
                    done || active
                      ? `2px solid ${GREEN}`
                      : "2px solid rgba(255,255,255,0.2)",
                  background: done
                    ? GREEN
                    : active
                      ? "rgba(57,255,20,0.15)"
                      : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <Check size={14} color="#000" strokeWidth={3} />
                ) : (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: active ? GREEN : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: active ? 700 : 400,
                  color: active
                    ? GREEN
                    : done
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(255,255,255,0.3)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: "20px",
                  height: "1px",
                  background: i < step ? GREEN : "rgba(255,255,255,0.15)",
                  margin: "0 4px",
                  marginBottom: "22px",
                  transition: "background 0.3s ease",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar Grid ─────────────────────────────────────────────────────────────
function CalendarStep({
  availability,
  selectedDate,
  onSelect,
}: {
  availability: AvailabilitySettings;
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function isDayAvailable(d: Date): boolean {
    if (d < today) return false;
    const dayKey = DAY_KEYS[d.getDay()];
    const sched = availability.weeklySchedule[dayKey];
    if (!sched || !sched.isOpen) return false;
    const dateStr = formatDateStr(d);
    if (availability.blockedDates.includes(dateStr)) return false;
    return true;
  }

  function isSelected(d: Date) {
    return (
      selectedDate !== null &&
      selectedDate.getFullYear() === d.getFullYear() &&
      selectedDate.getMonth() === d.getMonth() &&
      selectedDate.getDate() === d.getDate()
    );
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const cellKeys: string[] = [];
  const cellDates: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    cellKeys.push(`empty-${viewYear}-${viewMonth}-${i}`);
    cellDates.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cellKeys.push(`day-${viewYear}-${viewMonth}-${d}`);
    cellDates.push(toDate(viewYear, viewMonth, d));
  }

  return (
    <div>
      {/* Month navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={prevMonth}
          data-ocid="cal.prev_month"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: BORDER,
            borderRadius: "8px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            transition: "background 0.2s",
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.04em",
          }}
        >
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          data-ocid="cal.next_month"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: BORDER,
            borderRadius: "8px",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            transition: "background 0.2s",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          marginBottom: "8px",
        }}
      >
        {DAY_LABELS.map((dl) => (
          <div
            key={dl}
            style={{
              textAlign: "center",
              fontSize: "11px",
              fontWeight: 600,
              color: MUTED,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 0",
            }}
          >
            {dl}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
        }}
      >
        {cellDates.map((d, i) => {
          const cellKey = cellKeys[i];
          if (!d) return <div key={cellKey} aria-hidden="true" />;
          const available = isDayAvailable(d);
          const selected = isSelected(d);
          const isToday =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
          return (
            <button
              key={cellKey}
              type="button"
              onClick={() => available && onSelect(d)}
              data-ocid={`cal.day.${d.getDate()}`}
              style={{
                aspectRatio: "1",
                borderRadius: "8px",
                border: selected
                  ? `2px solid ${GREEN}`
                  : isToday && available
                    ? "1px solid rgba(57,255,20,0.4)"
                    : "1px solid transparent",
                background: selected
                  ? "rgba(57,255,20,0.18)"
                  : isToday
                    ? "rgba(57,255,20,0.06)"
                    : "rgba(255,255,255,0.03)",
                color: selected
                  ? GREEN
                  : available
                    ? "#fff"
                    : "rgba(255,255,255,0.22)",
                fontSize: "13px",
                fontWeight: selected ? 700 : 400,
                cursor: available ? "pointer" : "not-allowed",
                transition: "all 0.18s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time Slot Step ────────────────────────────────────────────────────────────
function TimeStep({
  availability,
  selectedDate,
  selectedTime,
  onSelect,
  onBack,
}: {
  availability: AvailabilitySettings;
  selectedDate: Date;
  selectedTime: number | null;
  onSelect: (h: number) => void;
  onBack: () => void;
}) {
  const dayKey = DAY_KEYS[selectedDate.getDay()];
  const sched = availability.weeklySchedule[dayKey];
  const startHour = sched ? Number(sched.startHour) : 9;
  const endHour = sched ? Number(sched.endHour) : 17;

  const now = new Date();
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

  const slots: number[] = [];
  for (let h = startHour; h < endHour; h++) {
    if (isToday) {
      const slotTime = new Date(selectedDate);
      slotTime.setHours(h, 0, 0, 0);
      const bufferMs = 2 * 60 * 60 * 1000;
      if (slotTime.getTime() - now.getTime() < bufferMs) continue;
    }
    slots.push(h);
  }

  const MONTH_ABBR = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dateLabel = `${MONTH_ABBR[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        data-ocid="cal.back_to_date"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          color: GREEN,
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "20px",
          padding: "0",
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={14} /> {dateLabel}
      </button>

      {slots.length === 0 ? (
        <p style={{ color: MUTED, textAlign: "center", padding: "32px 0" }}>
          No available slots for this day. Please select another date.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          {slots.map((h) => {
            const active = selectedTime === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => onSelect(h)}
                data-ocid={`cal.slot.${h}`}
                style={{
                  padding: "12px 8px",
                  borderRadius: "10px",
                  border: active ? `2px solid ${GREEN}` : GREEN_BORDER,
                  background: active
                    ? "rgba(57,255,20,0.15)"
                    : "rgba(255,255,255,0.04)",
                  color: active ? GREEN : "rgba(255,255,255,0.85)",
                  fontSize: "13px",
                  fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Clock size={13} />
                {formatTimeLabel(h)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Meeting Method Step ───────────────────────────────────────────────────────
function MeetingMethodStep({
  method,
  onSelect,
  onBack,
}: {
  method: MeetingMethod | null;
  onSelect: (m: MeetingMethod) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        data-ocid="cal.back_to_time"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          color: GREEN,
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "28px",
          padding: "0",
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <p
        style={{
          color: MUTED,
          fontSize: "14px",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}
      >
        How would you like to meet? Both options are free — choose what works
        best for you.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {(
          [
            {
              key: "phone" as MeetingMethod,
              label: "Phone Call",
              sub: "We'll call you at the time you book",
              Icon: Phone,
            },
            {
              key: "google_meet" as MeetingMethod,
              label: "Google Meet",
              sub: "Video call — link sent in your confirmation email",
              Icon: Video,
            },
          ] as const
        ).map(({ key, label, sub, Icon }) => {
          const active = method === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              data-ocid={`cal.method.${key}`}
              style={{
                padding: "18px 20px",
                borderRadius: "12px",
                border: active ? `2px solid ${GREEN}` : GREEN_BORDER,
                background: active
                  ? "rgba(57,255,20,0.12)"
                  : "rgba(255,255,255,0.04)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                textAlign: "left",
                transition: "all 0.18s ease",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: active
                    ? "rgba(57,255,20,0.2)"
                    : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                <Icon
                  size={20}
                  color={active ? GREEN : "rgba(255,255,255,0.6)"}
                />
              </div>
              <div>
                <div
                  style={{
                    color: active ? GREEN : "#fff",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{ color: MUTED, fontSize: "12px", marginTop: "3px" }}
                >
                  {sub}
                </div>
              </div>
              {active && (
                <div style={{ marginLeft: "auto" }}>
                  <Check size={18} color={GREEN} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Contact Form Step ─────────────────────────────────────────────────────────
function ContactFormStep({
  method,
  form,
  onChange,
  onBack,
  onSubmit,
  loading,
}: {
  method: MeetingMethod;
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: GREEN_BORDER,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
    transition: "border-color 0.2s",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    color: MUTED,
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: "6px",
  };
  const sectionHeadingStyle: React.CSSProperties = {
    color: GREEN,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "14px",
    marginTop: "0",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(57,255,20,0.18)",
  };

  const SERVICE_OPTIONS = [
    {
      id: "custom_sites",
      label: "Custom Sites",
      Icon: Globe,
      sub: "Fully bespoke web design",
    },
    {
      id: "speedy_sites",
      label: "Speedy Sites",
      Icon: Zap,
      sub: "Fast-launch website packages",
    },
    {
      id: "ai_receptionists",
      label: "AI Receptionists",
      Icon: Bot,
      sub: "Automated client intake",
    },
    {
      id: "cinematic_ads",
      label: "Cinematic Ads",
      Icon: Film,
      sub: "High-end video advertising",
    },
    {
      id: "product_ads",
      label: "Product Ads",
      Icon: ShoppingCart,
      sub: "E-commerce product campaigns",
    },
    {
      id: "site_audit",
      label: "Professional Site Audit",
      Icon: Search,
      sub: "$99 — full UX & SEO review",
    },
    {
      id: "free_consultation",
      label: "Free Strategy Consultation",
      Icon: MessageSquare,
      sub: "30-min strategy session",
    },
  ];

  const REVENUE_OPTIONS = [
    "Under $5k",
    "$5k–$10k",
    "$10k–$25k",
    "$25k–$50k",
    "$50k+",
  ];

  const BEST_TIME_OPTIONS = [
    "Morning (9am–12pm)",
    "Afternoon (12pm–5pm)",
    "Evening (5pm–8pm)",
  ];

  const isValid =
    !!form.name.trim() &&
    !!form.email.trim() &&
    (method !== "phone" || !!form.phone.trim()) &&
    !!form.serviceType &&
    !!form.businessName.trim() &&
    !!form.industry.trim() &&
    !!form.monthlyRevenue;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        data-ocid="cal.back_to_method"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          color: GREEN,
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "24px",
          padding: "0",
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* ── Contact Fields ── */}
        <div>
          <p style={sectionHeadingStyle}>Contact Details</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label htmlFor="cal-name" style={labelStyle}>
                Full Name *
              </label>
              <input
                id="cal-name"
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                data-ocid="cal.name_input"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="cal-email" style={labelStyle}>
                Email Address *
              </label>
              <input
                id="cal-email"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
                data-ocid="cal.email_input"
                style={inputStyle}
                required
              />
            </div>
            {method === "phone" && (
              <div>
                <label htmlFor="cal-phone" style={labelStyle}>
                  Phone Number *
                </label>
                <input
                  id="cal-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => onChange({ phone: e.target.value })}
                  data-ocid="cal.phone_input"
                  style={inputStyle}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="cal-business" style={labelStyle}>
                Business Name{" "}
                <span style={{ color: MUTED, fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                id="cal-business"
                type="text"
                placeholder="Acme Corp"
                value={form.business}
                onChange={(e) => onChange({ business: e.target.value })}
                data-ocid="cal.business_input"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── Service Selection ── */}
        <div>
          <p style={sectionHeadingStyle}>Service</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: "10px",
            }}
            className="cal-service-grid"
          >
            <style>
              {
                "@media (min-width: 480px) { .cal-service-grid { grid-template-columns: repeat(2, 1fr) !important; } }"
              }
            </style>
            {SERVICE_OPTIONS.map(({ id, label, Icon, sub }) => {
              const active = form.serviceType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange({ serviceType: id })}
                  data-ocid={`cal.service.${id}`}
                  style={{
                    background: active
                      ? "rgba(57,255,20,0.06)"
                      : "rgba(255,255,255,0.03)",
                    border: active
                      ? "2px solid #39FF14"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    padding: active ? "23px 15px" : "24px 16px",
                    cursor: "pointer",
                    textAlign: "left",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: active
                      ? "0 0 0 1px #39FF14, 0 8px 32px rgba(57,255,20,0.25), inset 0 1px 0 rgba(255,255,255,0.05)"
                      : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      const el = e.currentTarget;
                      el.style.transform = "translateY(-6px)";
                      el.style.background = "rgba(57,255,20,0.04)";
                      el.style.boxShadow =
                        "0 8px 32px rgba(57,255,20,0.15), 0 0 0 1px rgba(57,255,20,0.2), inset 0 1px 0 rgba(255,255,255,0.07)";
                      el.style.borderColor = "rgba(57,255,20,0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
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
                      background: active
                        ? "rgba(57,255,20,0.15)"
                        : "rgba(57,255,20,0.08)",
                      border: active
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
                    style={{
                      color: "#7A7D90",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    {sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Business Info ── */}
        <div>
          <p style={sectionHeadingStyle}>Business Info</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label htmlFor="cal-biz-name" style={labelStyle}>
                Business Name *
              </label>
              <input
                id="cal-biz-name"
                type="text"
                placeholder="Acme Corporation"
                value={form.businessName}
                onChange={(e) => onChange({ businessName: e.target.value })}
                data-ocid="cal.businessname_input"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="cal-industry" style={labelStyle}>
                Industry *
              </label>
              <input
                id="cal-industry"
                type="text"
                placeholder="e.g. Real Estate, E-commerce, Healthcare"
                value={form.industry}
                onChange={(e) => onChange({ industry: e.target.value })}
                data-ocid="cal.industry_input"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label htmlFor="cal-revenue" style={labelStyle}>
                Monthly Revenue *
              </label>
              <select
                id="cal-revenue"
                value={form.monthlyRevenue}
                onChange={(e) => onChange({ monthlyRevenue: e.target.value })}
                data-ocid="cal.revenue_select"
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="" disabled>
                  Select a range…
                </option>
                {REVENUE_OPTIONS.map((r) => (
                  <option key={r} value={r} style={{ background: "#0A0B14" }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cal-website" style={labelStyle}>
                Website URL{" "}
                <span style={{ color: MUTED, fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                id="cal-website"
                type="url"
                placeholder="https://yourbusiness.com"
                value={form.websiteUrl}
                onChange={(e) => onChange({ websiteUrl: e.target.value })}
                data-ocid="cal.website_input"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── Best Time ── */}
        <div>
          <p style={sectionHeadingStyle}>Availability</p>
          <div>
            <label htmlFor="cal-best-time" style={labelStyle}>
              Best Time to Call{" "}
              <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              id="cal-best-time"
              value={form.bestTime}
              onChange={(e) => onChange({ bestTime: e.target.value })}
              data-ocid="cal.besttime_select"
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">No preference</option>
              {BEST_TIME_OPTIONS.map((t) => (
                <option key={t} value={t} style={{ background: "#0A0B14" }}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || !isValid}
        data-ocid="cal.submit_button"
        style={{
          marginTop: "28px",
          width: "100%",
          padding: "14px",
          minHeight: "44px",
          borderRadius: "10px",
          border: "none",
          background: loading || !isValid ? "rgba(57,255,20,0.3)" : GREEN,
          color: loading || !isValid ? "rgba(0,0,0,0.4)" : "#000",
          fontSize: "15px",
          fontWeight: 800,
          cursor: loading || !isValid ? "not-allowed" : "pointer",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                border: "2px solid rgba(0,0,0,0.4)",
                borderTop: "2px solid #000",
                borderRadius: "50%",
                animation: "calSpin 0.7s linear infinite",
              }}
            />
            Booking…
          </>
        ) : (
          "Confirm Booking"
        )}
      </button>
    </div>
  );
}

// ─── Success State ─────────────────────────────────────────────────────────────
function SuccessState({
  method,
  onReset,
}: { method: MeetingMethod; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: "20px",
      }}
      data-ocid="cal.success_state"
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(57,255,20,0.15)",
          border: `2px solid ${GREEN}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Check size={32} color={GREEN} strokeWidth={2.5} />
      </div>
      <h3
        style={{
          color: "#fff",
          fontSize: "22px",
          fontWeight: 800,
          margin: "0",
        }}
      >
        You're Booked!
      </h3>
      <p
        style={{
          color: MUTED,
          fontSize: "14px",
          lineHeight: 1.7,
          margin: "0",
          maxWidth: "340px",
        }}
      >
        {method === "google_meet"
          ? "A Google Meet link has been sent to your email along with your confirmation."
          : "We'll call you at the scheduled time. Check your email for confirmation details."}
      </p>
      <button
        type="button"
        onClick={onReset}
        data-ocid="cal.book_another_button"
        style={{
          marginTop: "8px",
          padding: "10px 28px",
          borderRadius: "8px",
          border: GREEN_BORDER,
          background: "transparent",
          color: GREEN,
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          transition: "background 0.2s",
        }}
      >
        Book Another
      </button>
    </motion.div>
  );
}

// ─── Sidebar Info ──────────────────────────────────────────────────────────────
function SidebarInfo({
  selectedDate,
  selectedTime,
  method,
}: {
  selectedDate: Date | null;
  selectedTime: number | null;
  method: MeetingMethod | null;
}) {
  const MONTH_ABBR = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const DAY_FULL = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const perks = [
    { icon: "🎯", text: "30-minute strategy session" },
    { icon: "💡", text: "Custom growth recommendations" },
    { icon: "🛡️", text: "No sales pressure, ever" },
    { icon: "⚡", text: "See results in the first call" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h3
          style={{
            color: GREEN,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          What to Expect
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {perks.map((p) => (
            <div
              key={p.text}
              style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
            >
              <span
                style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1.3 }}
              >
                {p.icon}
              </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                {p.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking summary */}
      {(selectedDate || selectedTime !== null || method) && (
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            border: GREEN_BORDER,
            background: "rgba(57,255,20,0.05)",
          }}
          data-ocid="cal.booking_summary"
        >
          <h4
            style={{
              color: GREEN,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Your Selection
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {selectedDate && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Calendar size={13} color={GREEN} />
                <span
                  style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}
                >
                  {DAY_FULL[selectedDate.getDay()]},{" "}
                  {MONTH_ABBR[selectedDate.getMonth()]} {selectedDate.getDate()}
                </span>
              </div>
            )}
            {selectedTime !== null && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Clock size={13} color={GREEN} />
                <span
                  style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}
                >
                  {formatTimeLabel(selectedTime)}
                </span>
              </div>
            )}
            {method && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {method === "phone" ? (
                  <Phone size={13} color={GREEN} />
                ) : (
                  <Video size={13} color={GREEN} />
                )}
                <span
                  style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}
                >
                  {method === "phone" ? "Phone Call" : "Google Meet"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust badge */}
      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          border: BORDER,
          background: "rgba(255,255,255,0.03)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Users size={18} color={MUTED} />
        <span style={{ color: MUTED, fontSize: "12px", lineHeight: 1.5 }}>
          Trusted by 50+ businesses.
          <br />
          Your data is always private.
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HomepageCalendarBooking() {
  const { actor } = useActor();
  const [availability, setAvailability] = useState<AvailabilitySettings | null>(
    null,
  );
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [availError, setAvailError] = useState(false);

  const [step, setStep] = useState<Step>(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [method, setMethod] = useState<MeetingMethod | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    business: "",
    serviceType: "",
    businessName: "",
    industry: "",
    monthlyRevenue: "",
    websiteUrl: "",
    bestTime: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch availability on mount
  useEffect(() => {
    if (!actor) return;
    setLoadingAvail(true);
    actor
      .getPublicAvailability()
      .then((a) => {
        setAvailability(a);
        setLoadingAvail(false);
      })
      .catch(() => {
        setAvailError(true);
        setLoadingAvail(false);
      });
  }, [actor]);

  const handleDateSelect = useCallback((d: Date) => {
    setSelectedDate(d);
    setSelectedTime(null);
    setStep(1);
  }, []);

  const handleTimeSelect = useCallback((h: number) => {
    setSelectedTime(h);
    setStep(2);
  }, []);

  const handleMethodSelect = useCallback((m: MeetingMethod) => {
    setMethod(m);
    setStep(3);
  }, []);

  const handleFormChange = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!actor || !selectedDate || selectedTime === null || !method) return;
    if (!form.name.trim() || !form.email.trim()) return;
    if (method === "phone" && !form.phone.trim()) return;
    if (
      !form.serviceType ||
      !form.businessName.trim() ||
      !form.industry.trim() ||
      !form.monthlyRevenue
    )
      return;

    setSubmitting(true);
    setSubmitError(null);

    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const preferredDate = `${y}-${mo}-${d}`;
    const preferredTime = `${padTwo(selectedTime)}:00`;
    const requestedTime = formatTimeLabel(selectedTime);

    const messageJson = JSON.stringify({
      meetingMethod: method,
      contact_phone: form.phone,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      requested_time: requestedTime,
      service_type: form.serviceType,
      businessName: form.business,
      business_name: form.businessName,
      industry: form.industry,
      monthly_revenue: form.monthlyRevenue,
      website_url: form.websiteUrl,
      best_time: form.bestTime,
    });

    try {
      await actor.createLead(
        "/homepage-calendar",
        form.name.trim(),
        form.email.trim(),
        form.business.trim(),
        messageJson,
      );
      setSubmitted(true);
    } catch (_err) {
      setSubmitError(
        "Something went wrong. Please try again or contact us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [actor, selectedDate, selectedTime, method, form]);

  const handleReset = useCallback(() => {
    setStep(0);
    setSelectedDate(null);
    setSelectedTime(null);
    setMethod(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      business: "",
      serviceType: "",
      businessName: "",
      industry: "",
      monthlyRevenue: "",
      websiteUrl: "",
      bestTime: "",
    });
    setSubmitError(null);
    setSubmitted(false);
  }, []);

  return (
    <section
      style={{
        background: BG,
        padding: "60px 16px",
        position: "relative",
        overflow: "hidden",
      }}
      data-ocid="homepage_calendar.section"
    >
      {/* Keyframes */}
      <style>{`
        @keyframes calSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background:
            "radial-gradient(ellipse at top, rgba(57,255,20,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}
      >
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "32px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "999px",
              border: GREEN_BORDER,
              background: "rgba(57,255,20,0.08)",
              marginBottom: "20px",
            }}
          >
            <Calendar size={13} color={GREEN} />
            <span
              style={{
                color: GREEN,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Free Consultation
            </span>
          </div>
          <h2
            style={{
              color: "#fff",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              margin: "0 0 16px",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            Book a Free Strategy Call
          </h2>
          <p
            style={{
              color: MUTED,
              fontSize: "16px",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Pick a time that works for you. We'll talk through your goals,
            answer any questions, and map out a plan — no commitment required.
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            background: CARD_BG,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: BORDER,
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {loadingAvail ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px",
                gap: "12px",
                color: MUTED,
                fontSize: "14px",
              }}
              data-ocid="cal.loading_state"
            >
              <span
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "20px",
                  border: "2px solid rgba(57,255,20,0.3)",
                  borderTop: `2px solid ${GREEN}`,
                  borderRadius: "50%",
                  animation: "calSpin 0.7s linear infinite",
                }}
              />
              Loading availability…
            </div>
          ) : availError || !availability ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "80px",
                gap: "12px",
              }}
              data-ocid="cal.error_state"
            >
              <p
                style={{
                  color: "rgba(255,100,100,0.9)",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                Could not load availability. Please refresh the page or{" "}
                <a
                  href="/intake"
                  style={{ color: GREEN, textDecoration: "underline" }}
                >
                  use our booking form
                </a>
                .
              </p>
            </div>
          ) : submitted ? (
            <SuccessState method={method ?? "phone"} onReset={handleReset} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "0",
              }}
              className="cal-grid"
            >
              <style>{`
                @media (min-width: 768px) {
                  .cal-grid { grid-template-columns: 1fr 300px !important; }
                  .cal-sidebar { border-top: none !important; border-left: 1px solid #1C1F33 !important; }
                  .sm-cal-content { padding: 40px 36px !important; }
                  .cal-sidebar { padding: 40px 28px !important; }
                }
              `}</style>

              {/* Left: step content */}
              <div style={{ padding: "24px 16px" }} className="sm-cal-content">
                <StepIndicator step={step} />

                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div
                      key="step-date"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22 }}
                    >
                      <CalendarStep
                        availability={availability}
                        selectedDate={selectedDate}
                        onSelect={handleDateSelect}
                      />
                    </motion.div>
                  )}
                  {step === 1 && selectedDate && (
                    <motion.div
                      key="step-time"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22 }}
                    >
                      <TimeStep
                        availability={availability}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        onSelect={handleTimeSelect}
                        onBack={() => setStep(0)}
                      />
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div
                      key="step-method"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22 }}
                    >
                      <MeetingMethodStep
                        method={method}
                        onSelect={handleMethodSelect}
                        onBack={() => setStep(1)}
                      />
                    </motion.div>
                  )}
                  {step === 3 && method && (
                    <motion.div
                      key="step-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22 }}
                    >
                      <ContactFormStep
                        method={method}
                        form={form}
                        onChange={handleFormChange}
                        onBack={() => setStep(2)}
                        onSubmit={handleSubmit}
                        loading={submitting}
                      />
                      {submitError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            marginTop: "12px",
                            color: "rgba(255,100,100,0.9)",
                            fontSize: "13px",
                            textAlign: "center",
                          }}
                          data-ocid="cal.error_state"
                        >
                          {submitError}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: sidebar */}
              <div
                className="cal-sidebar"
                style={{
                  padding: "24px 16px",
                  borderTop: "1px solid #1C1F33",
                  background: "rgba(10,11,20,0.5)",
                }}
              >
                <SidebarInfo
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  method={method}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
