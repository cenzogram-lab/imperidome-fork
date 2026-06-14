import {
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  Clock,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";
import TypewriterText from "../components/TypewriterText";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";

// ─── Types ────────────────────────────────────────────────────────────────────
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

type LeadData = {
  id: string;
  name: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  meetingMethod: string;
  [key: string]: unknown;
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

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Design tokens (match IntakePage exactly) ─────────────────────────────────
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

const labelStyle: React.CSSProperties = {
  display: "block",
  color: MUTED,
  fontSize: "13px",
  marginBottom: "6px",
  fontWeight: 500,
};

// ─── Date + Time Picker (mirrors IntakePage's DateTimePicker) ─────────────────
function RescheduleDateTimePicker({
  availability,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  dateError,
  onDateError,
}: {
  availability: AvailabilitySettings | null;
  selectedDate: string;
  selectedSlot: string;
  onDateChange: (d: string) => void;
  onSlotChange: (s: string) => void;
  dateError: string | null;
  onDateError: (err: string | null) => void;
}) {
  const todayISO = toLocalISODate(new Date());

  const slots: string[] = (() => {
    if (!availability || !selectedDate) return [];
    const d = new Date(`${selectedDate}T12:00:00`);
    return getAvailableSlots(availability, d);
  })();

  function handleDateChange(iso: string) {
    onDateChange(iso);
    onSlotChange("");
  }

  function handleNativeDateChange(iso: string) {
    if (!availability) {
      onDateError(null);
      handleDateChange(iso);
      return;
    }
    const d = new Date(`${iso}T12:00:00`);
    if (!isDateAvailable(availability, d)) {
      // BUG9 fix: show error message instead of silently ignoring
      onDateError("This date is unavailable. Please choose another date.");
      return;
    }
    onDateError(null);
    handleDateChange(iso);
  }

  const hasAvailability = availability !== null;
  const noSlotsForDay = hasAvailability && selectedDate && slots.length === 0;

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "18px",
        }}
      >
        <CalendarDays size={18} color={PRIMARY} />
        <span style={{ color: TEXT, fontSize: "14px", fontWeight: 600 }}>
          Choose a New Date &amp; Time
        </span>
      </div>

      <div style={{ marginBottom: selectedDate ? "18px" : "0" }}>
        <label
          htmlFor="reschedule-date"
          style={{ ...labelStyle, marginBottom: "8px" }}
        >
          Select a date
        </label>
        <input
          id="reschedule-date"
          data-ocid="reschedule.date.input"
          type="date"
          min={todayISO}
          value={selectedDate}
          onChange={(e) => handleNativeDateChange(e.target.value)}
          style={{ ...inputStyle, colorScheme: "dark", cursor: "pointer" }}
        />
        {/* BUG9: show blocked-date error prominently */}
        {dateError && (
          <p
            data-ocid="reschedule.date.error_state"
            style={{
              color: "#F87171",
              fontSize: "13px",
              marginTop: "6px",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: "6px",
              padding: "8px 12px",
            }}
          >
            {dateError}
          </p>
        )}
        {!dateError && hasAvailability && selectedDate && (
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

      {/* Only show time slots when no date error and a valid date is selected */}
      {!dateError && selectedDate && slots.length > 0 && (
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
            data-ocid="reschedule.timeSlots.grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: "8px",
            }}
          >
            {slots.map((slot) => {
              const selected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  data-ocid={`reschedule.timeSlot.${slot.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.button`}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReschedulePage() {
  // Extract token from URL path: /reschedule/:token
  const token = window.location.pathname.split("/reschedule/")[1] ?? "";

  const { actor, isFetching } = useActor();

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

  type PageState =
    | "loading"
    | "not_found"
    | "expired"
    | "valid"
    | "success"
    | "error";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [lead, setLead] = useState<LeadData | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySettings | null>(
    null,
  );

  // Reschedule form state
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("");
  const [newMethod, setNewMethod] = useState<"phone" | "google_meet">("phone");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [successDate, setSuccessDate] = useState("");
  const [successSlot, setSuccessSlot] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  // Fetch lead + availability once actor is ready
  useEffect(() => {
    if (!actor || isFetching || !token) return;

    // Parallel fetch: lead data + availability
    Promise.all([
      (actor as backendInterface).getRescheduleLeadByToken(token),
      (actor as backendInterface)
        .getAvailability()
        .catch(() => null) as Promise<AvailabilitySettings | null>,
    ])
      .then(([result, avail]) => {
        if (avail) setAvailability(avail);
        if (!result) {
          setPageState("not_found");
          return;
        }
        if (result.isExpired) {
          setPageState("expired");
          return;
        }
        // Parse preferredDate and preferredTime out of the message JSON string
        let parsedDate = "";
        let parsedTime = "";
        try {
          const msgData = JSON.parse(result.lead.message as string);
          if (msgData && typeof msgData === "object") {
            parsedDate =
              typeof msgData.preferredDate === "string"
                ? msgData.preferredDate
                : "";
            parsedTime =
              typeof msgData.preferredTime === "string"
                ? msgData.preferredTime
                : "";
          }
        } catch {
          // message is not JSON or missing fields — defaults stay as empty strings
        }
        setLead({
          ...result.lead,
          preferredDate: parsedDate,
          preferredTime: parsedTime,
        });
        // Pre-select the current meeting method
        const method = result.lead.meetingMethod;
        if (method === "google_meet" || method === "phone") {
          setNewMethod(method);
        }
        setPageState("valid");
      })
      .catch(() => {
        setPageState("not_found");
      });
  }, [actor, isFetching, token]);

  async function handleConfirmReschedule() {
    if (!actor || !newDate || !newSlot) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const result = await (actor as backendInterface).rescheduleLead(
        token,
        newDate,
        newSlot,
        newMethod,
      );

      if (result.ok) {
        setSuccessDate(newDate);
        setSuccessSlot(newSlot);
        setPageState("success");
      } else {
        setErrorMsg(
          result.message || "Something went wrong. Please try again.",
        );
      }
    } catch {
      setErrorMsg("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function PageShell({ children }: { children: React.ReactNode }) {
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
            padding: "40px 16px",
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
            data-ocid="reschedule.panel"
            style={{
              width: "100%",
              maxWidth: "560px",
              background: CARD,
              backdropFilter: "blur(12px)",
              border: `1px solid ${BORDER}`,
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 48px)",
              position: "relative",
              zIndex: 1,
              boxSizing: "border-box",
            }}
          >
            {children}
          </div>
        </div>
        <style>{`
          input::placeholder { color: #7A7D90; }
          input:focus { border-color: #5EF08A !important; outline: none; }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1) sepia(1) saturate(3) hue-rotate(90deg);
            cursor: pointer; opacity: 0.7;
          }
          input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <PageShell>
        <div
          data-ocid="reschedule.loading_state"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "40px 0",
          }}
        >
          <Loader2
            size={36}
            color={PRIMARY}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p style={{ color: MUTED, fontSize: "14px" }}>
            Loading your booking…
          </p>
        </div>
      </PageShell>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (pageState === "not_found") {
    return (
      <PageShell>
        <div
          data-ocid="reschedule.not_found_state"
          style={{ textAlign: "center", padding: "20px 0" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(248,113,113,0.12)",
              border: "2px solid rgba(248,113,113,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "28px",
            }}
          >
            🔗
          </div>
          <h2
            style={{
              color: TEXT,
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "10px",
              fontFamily: "'Courier New', monospace",
            }}
          >
            <TypewriterText text="Link not found" speed={55} />
          </h2>
          <p
            style={{
              color: MUTED,
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "28px",
            }}
          >
            This reschedule link is invalid or has already been used.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              background: "transparent",
              border: `1px solid ${BORDER}`,
              color: TEXT,
              borderRadius: "10px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "border-color 0.2s",
            }}
          >
            Back to Home
          </a>
        </div>
      </PageShell>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────────────
  if (pageState === "expired") {
    return (
      <PageShell>
        <div
          data-ocid="reschedule.expired_state"
          style={{ textAlign: "center", padding: "20px 0" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(249,115,22,0.12)",
              border: "2px solid rgba(249,115,22,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "28px",
            }}
          >
            ⏰
          </div>
          <h2
            style={{
              color: TEXT,
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "10px",
              fontFamily: "'Courier New', monospace",
            }}
          >
            <TypewriterText text="Reschedule link expired" speed={50} />
          </h2>
          <p
            style={{
              color: MUTED,
              fontSize: "14px",
              lineHeight: 1.7,
              marginBottom: "8px",
            }}
          >
            Meetings can only be rescheduled more than 4 hours in advance.
          </p>
          <p
            style={{
              color: MUTED,
              fontSize: "14px",
              lineHeight: 1.7,
              marginBottom: "28px",
            }}
          >
            Please{" "}
            <a
              href="/"
              style={{
                color: PRIMARY,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              contact us directly
            </a>{" "}
            to reschedule.
          </p>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: `1px solid ${BORDER}`,
              color: TEXT,
              borderRadius: "10px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ChevronLeft size={16} />
            Back to Home
          </a>
        </div>
      </PageShell>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <PageShell>
        <div
          data-ocid="reschedule.success_state"
          style={{
            textAlign: "center",
            padding: "20px 0",
            animation: "fadeIn 0.4s ease forwards",
          }}
        >
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
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "10px",
              fontFamily: "'Courier New', monospace",
            }}
          >
            <TypewriterText text="Meeting rescheduled!" speed={50} />
          </h2>
          <p
            style={{
              color: MUTED,
              fontSize: "14px",
              lineHeight: 1.7,
              marginBottom: "20px",
            }}
          >
            Your meeting has been rescheduled to{" "}
            <span style={{ color: PRIMARY, fontWeight: 600 }}>
              {formatDisplayDate(successDate)}
            </span>{" "}
            at{" "}
            <span style={{ color: PRIMARY, fontWeight: 600 }}>
              {successSlot}
            </span>
            .
          </p>
          <p style={{ color: MUTED, fontSize: "13px", marginBottom: "28px" }}>
            A confirmation email is on the way.
          </p>
          <a
            href="/"
            data-ocid="reschedule.back_home.link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: PRIMARY,
              color: BTN_DARK,
              borderRadius: "10px",
              padding: "11px 28px",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(94,240,138,0.25)",
            }}
          >
            Back to Home
          </a>
        </div>
      </PageShell>
    );
  }

  // ── Valid — show reschedule form ──────────────────────────────────────────────
  const currentMethodLabel =
    lead?.meetingMethod === "google_meet" ? "📹 Google Meet" : "📞 Phone Call";

  return (
    <PageShell>
      <div
        ref={formRef}
        data-ocid="reschedule.form"
        style={{ animation: "fadeIn 0.4s ease forwards" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(94,240,138,0.08)",
              border: "1px solid rgba(94,240,138,0.2)",
              borderRadius: "20px",
              padding: "4px 12px",
              marginBottom: "16px",
            }}
          >
            <CalendarDays size={13} color={PRIMARY} />
            <span
              style={{
                color: PRIMARY,
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Reschedule
            </span>
          </div>
          <h2
            style={{
              color: TEXT,
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "8px",
              fontFamily: "'Courier New', monospace",
            }}
          >
            <TypewriterText text="Change your booking" speed={50} />
          </h2>
          <p style={{ color: MUTED, fontSize: "14px", lineHeight: 1.6 }}>
            Pick a new date and time below.
          </p>
        </div>

        {/* Current booking summary */}
        <div
          data-ocid="reschedule.current_booking.card"
          style={{
            background: "rgba(19,21,36,0.8)",
            border: `1px solid ${BORDER}`,
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              color: MUTED,
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "10px",
            }}
          >
            Current Booking
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {lead?.name && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: MUTED, fontSize: "13px" }}>Name</span>
                <span
                  style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}
                >
                  {lead.name}
                </span>
              </div>
            )}
            {lead?.preferredDate && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: MUTED, fontSize: "13px" }}>Date</span>
                <span
                  style={{ color: PRIMARY, fontSize: "13px", fontWeight: 600 }}
                >
                  {formatDisplayDate(lead.preferredDate)}
                </span>
              </div>
            )}
            {lead?.preferredTime && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: MUTED, fontSize: "13px" }}>Time</span>
                <span
                  style={{ color: PRIMARY, fontSize: "13px", fontWeight: 600 }}
                >
                  {lead.preferredTime}
                </span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: MUTED, fontSize: "13px" }}>Method</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "2px 10px",
                  borderRadius: "20px",
                  background:
                    lead?.meetingMethod === "phone"
                      ? "rgba(249,115,22,0.15)"
                      : "rgba(59,130,246,0.15)",
                  color:
                    lead?.meetingMethod === "phone" ? "#F97316" : "#3B82F6",
                  border:
                    lead?.meetingMethod === "phone"
                      ? "1px solid rgba(249,115,22,0.35)"
                      : "1px solid rgba(59,130,246,0.35)",
                }}
              >
                {currentMethodLabel}
              </span>
            </div>
          </div>
        </div>

        {/* New date/time picker */}
        <RescheduleDateTimePicker
          availability={availability}
          selectedDate={newDate}
          selectedSlot={newSlot}
          onDateChange={setNewDate}
          onSlotChange={setNewSlot}
          dateError={dateError}
          onDateError={setDateError}
        />

        {/* Meeting method toggle */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ ...labelStyle, marginBottom: "10px" }}>Meeting Method</p>
          <div
            data-ocid="reschedule.meetingMethod.toggle"
            style={{ display: "flex", gap: "10px", flexDirection: "column" }}
          >
            <button
              type="button"
              data-ocid="reschedule.meetingMethod.phone.button"
              onClick={() => setNewMethod("phone")}
              style={{
                flex: 1,
                padding: "12px 16px",
                minHeight: "44px",
                borderRadius: "10px",
                border:
                  newMethod === "phone"
                    ? "2px solid #F97316"
                    : `1px solid ${BORDER}`,
                background:
                  newMethod === "phone"
                    ? "rgba(249,115,22,0.12)"
                    : "rgba(255,255,255,0.03)",
                color: newMethod === "phone" ? "#F97316" : TEXT,
                fontWeight: newMethod === "phone" ? 700 : 500,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow:
                  newMethod === "phone"
                    ? "0 0 14px rgba(249,115,22,0.2)"
                    : "none",
              }}
            >
              <span style={{ fontSize: "16px" }}>📞</span>
              Phone Call
            </button>
            <button
              type="button"
              data-ocid="reschedule.meetingMethod.google_meet.button"
              onClick={() => setNewMethod("google_meet")}
              style={{
                flex: 1,
                padding: "12px 16px",
                minHeight: "44px",
                borderRadius: "10px",
                border:
                  newMethod === "google_meet"
                    ? "2px solid #3B82F6"
                    : `1px solid ${BORDER}`,
                background:
                  newMethod === "google_meet"
                    ? "rgba(59,130,246,0.12)"
                    : "rgba(255,255,255,0.03)",
                color: newMethod === "google_meet" ? "#3B82F6" : TEXT,
                fontWeight: newMethod === "google_meet" ? 700 : 500,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow:
                  newMethod === "google_meet"
                    ? "0 0 14px rgba(59,130,246,0.2)"
                    : "none",
              }}
            >
              <span style={{ fontSize: "16px" }}>📹</span>
              Google Meet
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <p
            data-ocid="reschedule.error_state"
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
            {errorMsg}
          </p>
        )}

        {/* Confirm button */}
        <button
          type="button"
          data-ocid="reschedule.confirm_button"
          onClick={handleConfirmReschedule}
          disabled={submitting || !newDate || !newSlot}
          style={
            {
              width: "100%",
              background:
                submitting || !newDate || !newSlot
                  ? "rgba(94,240,138,0.35)"
                  : PRIMARY,
              color: BTN_DARK,
              fontWeight: 700,
              fontSize: "15px",
              padding: "14px 24px",
              borderRadius: "10px",
              border: "none",
              cursor:
                submitting || !newDate || !newSlot ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              boxShadow:
                submitting || !newDate || !newSlot
                  ? "none"
                  : "0 4px 20px rgba(94,240,138,0.25)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            } as React.CSSProperties
          }
        >
          {submitting && (
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
            />
          )}
          {submitting ? "Rescheduling…" : "Confirm Reschedule"}
        </button>

        {/* Disabled-state hint */}
        {(!newDate || !newSlot) && (
          <p
            style={{
              color: MUTED,
              fontSize: "12px",
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            Select a date and time to continue.
          </p>
        )}
      </div>
    </PageShell>
  );
}
