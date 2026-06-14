import { useEffect, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import type { backendInterface } from "../../backend.d";
import LeadCalendar from "../../components/LeadCalendar";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";
import FilterChipsRow from "./FilterChipsRow";

// Matches the actual backend Lead type (V5 schema)
interface Lead {
  id: string;
  path: string;
  name: string;
  email: string;
  business: string;
  message: string;
  status: string;
  created_at: bigint;
  // Optional meeting integration fields
  meetingMethod?: string; // 'phone' | 'google_meet' | ''
  meetLink?: string; // Google Meet URL or ''
  // Draft / reschedule fields
  isDraft?: boolean;
  rescheduleToken?: string;
  rescheduleLinkSentAt?: bigint | null;
  // V5: conversion timestamp (nanoseconds). [] = not converted, [bigint] = converted at
  convertedAt?: [] | [bigint];
}

// Safe parser for the JSON payload stored in lead.message
function parseLeadMessage(message: string): Record<string, string> {
  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === "object")
      return parsed as Record<string, string>;
    return {};
  } catch {
    return {};
  }
}

const INTENT_TAGS = [
  "[PAID AUDIT]",
  "[FREE CONSULT]",
  "[PRODUCT LAB]",
] as const;

// Extract [PAID AUDIT], [FREE CONSULT], or [PRODUCT LAB] tag from the message field
function extractIntentTag(
  message: string,
): "paid_audit" | "free_consult" | "product_lab" | null {
  if (message.includes(INTENT_TAGS[0])) return "paid_audit";
  if (message.includes(INTENT_TAGS[1])) return "free_consult";
  if (message.includes(INTENT_TAGS[2]) || message.includes("💰 PRODUCT LAB"))
    return "product_lab";
  // Also check the prefix field in the JSON payload
  try {
    const parsed = JSON.parse(message);
    if (parsed?.prefix === "💰 PRODUCT LAB") return "product_lab";
    if (parsed?.prefix === "💰 PAID AUDIT") return "paid_audit";
    if (parsed?.prefix === "🗓️ FREE CONSULT") return "free_consult";
  } catch {
    // not JSON, fall through
  }
  return null;
}

// ── Meeting Method helpers ─────────────────────────────────────────────────

function getMeetingType(lead: Lead): "google_meet" | "phone" | null {
  // Priority 1: use explicit meetingMethod field if set
  if (lead.meetingMethod === "google_meet") return "google_meet";
  if (lead.meetingMethod === "phone") return "phone";
  // Priority 2: fall back to keyword heuristic in message/business fields
  const details = parseLeadMessage(lead.message);
  const haystack = [
    details.business_type ?? "",
    details.contact_phone ?? "",
    details.meetingMethod ?? "",
    lead.business ?? "",
    lead.message ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (haystack.includes("google meet") || haystack.includes("video"))
    return "google_meet";
  if (haystack.includes("phone") || haystack.includes("call")) return "phone";
  return null;
}

function DraftBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "rgba(251,146,60,0.15)",
        border: "1px solid rgba(251,146,60,0.4)",
        borderRadius: "5px",
        padding: "2px 7px",
        fontSize: "11px",
        fontWeight: 700,
        color: "#fb923c",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      ⏳ No Meeting Scheduled
    </span>
  );
}

function ConvertedBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "rgba(94,240,138,0.15)",
        border: "1px solid rgba(94,240,138,0.5)",
        borderRadius: "5px",
        padding: "2px 7px",
        fontSize: "11px",
        fontWeight: 700,
        color: "#5EF08A",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      ✓ Converted
    </span>
  );
}

function MeetingMethodBadge({
  lead,
  size = "sm",
}: { lead: Lead; size?: "sm" | "md" }) {
  // Draft leads show their own badge instead
  if (lead.isDraft || lead.status === "draft") return null;
  const mt = getMeetingType(lead);
  if (!mt) return null;
  const isVideo = mt === "google_meet";
  const padding = size === "md" ? "4px 10px" : "2px 7px";
  const fontSize = size === "md" ? "12px" : "11px";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: isVideo ? "rgba(66,133,244,0.15)" : "rgba(255,165,0,0.15)",
        border: isVideo
          ? "1px solid rgba(66,133,244,0.4)"
          : "1px solid rgba(255,165,0,0.4)",
        borderRadius: "5px",
        padding,
        fontSize,
        fontWeight: 600,
        color: isVideo ? "#60a5fa" : "#fb923c",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {isVideo ? "📹" : "📞"}
      &nbsp;
      {isVideo ? "Video" : "Phone"}
    </span>
  );
}

const COLUMNS: {
  key: string;
  label: string;
  colorScheme: "gray" | "green" | "red";
}[] = [
  { key: "Draft", label: "Draft", colorScheme: "gray" },
  { key: "New", label: "New Lead", colorScheme: "green" },
  { key: "Contacted", label: "Contacted", colorScheme: "green" },
  { key: "Qualified", label: "Qualified", colorScheme: "green" },
  { key: "Closed", label: "Closed", colorScheme: "red" },
  { key: "Cancelled", label: "Cancelled", colorScheme: "red" },
];
const _LEAD_STATUSES = COLUMNS.map((c) => c.key);

const STATUS_LABELS: Record<string, string> = {
  Draft: "Draft",
  New: "New Lead",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Closed: "Closed",
  Cancelled: "Cancelled",
};

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function IntentBadge({
  tag,
}: {
  tag: "paid_audit" | "free_consult" | "product_lab" | null;
}) {
  if (tag === "paid_audit") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(250,204,21,0.18)",
          color: "#fbbf24",
          border: "1.5px solid rgba(250,204,21,0.55)",
          borderRadius: "5px",
          fontSize: "11px",
          fontWeight: 800,
          padding: "3px 9px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        💰 PAID AUDIT
      </span>
    );
  }
  if (tag === "free_consult") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(59,130,246,0.18)",
          color: "#60a5fa",
          border: "1.5px solid rgba(59,130,246,0.55)",
          borderRadius: "5px",
          fontSize: "11px",
          fontWeight: 800,
          padding: "3px 9px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        🗓️ FREE CONSULT
      </span>
    );
  }
  if (tag === "product_lab") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(94,240,138,0.15)",
          color: "#5EF08A",
          border: "1.5px solid rgba(94,240,138,0.5)",
          borderRadius: "5px",
          fontSize: "11px",
          fontWeight: 800,
          padding: "3px 9px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        💰 PRODUCT LAB
      </span>
    );
  }
  return null;
}

function PathBadge({ path }: { path: string }) {
  const lowerPath = path.toLowerCase();
  if (lowerPath.includes("audit")) {
    return (
      <span
        style={{
          display: "inline-block",
          background: "rgba(250,204,21,0.15)",
          color: "#fbbf24",
          border: "1px solid rgba(250,204,21,0.3)",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 600,
          padding: "2px 8px",
          letterSpacing: "0.03em",
        }}
      >
        Audit
      </span>
    );
  }
  if (
    lowerPath.includes("product production") ||
    lowerPath.includes("product-lab") ||
    lowerPath.includes("product lab")
  ) {
    return (
      <span
        style={{
          display: "inline-block",
          background: "rgba(94,240,138,0.12)",
          color: "#5EF08A",
          border: "1px solid rgba(94,240,138,0.35)",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 600,
          padding: "2px 8px",
          letterSpacing: "0.03em",
        }}
      >
        Product Lab
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        background: "rgba(59,130,246,0.15)",
        color: "#60a5fa",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        letterSpacing: "0.03em",
      }}
    >
      Inquiry
    </span>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Delete lead"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ── Convert to Client Modal ──────────────────────────────────────────────────

interface ConvertToClientModalProps {
  prefillName: string;
  prefillEmail: string;
  prefillService: string;
  source: string;
  onClose: () => void;
  onSave: (
    name: string,
    email: string,
    phone: string,
    activeServices: string,
  ) => Promise<string | null>;
}

function ConvertToClientModal({
  prefillName,
  prefillEmail,
  prefillService,
  source,
  onClose,
  onSave,
}: ConvertToClientModalProps) {
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState("");
  const [activeServices, setActiveServices] = useState(prefillService);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    const result = await onSave(name, email, phone, activeServices);
    setSaving(false);
    if (result !== null) {
      setSuccessMsg("Client record created successfully");
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setErrorMsg("Failed to create client — please try again.");
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    background: "rgba(14,16,32,0.9)",
    border: "1px solid #1C1F33",
    borderRadius: "6px",
    padding: "9px 12px",
    fontSize: "14px",
    color: "#EEF0F8",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "#7A7D90",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
  };

  return (
    <div
      data-ocid="leads.convert_to_client.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0 }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter") onClose();
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        style={{
          background: "rgba(17,19,34,0.98)",
          border: "1px solid #1C1F33",
          borderRadius: "12px",
          maxWidth: "480px",
          width: "100%",
          padding: "32px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <h2
            style={{
              color: "#EEF0F8",
              fontSize: "18px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Convert to Client
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A7D90",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={{ color: "#7A7D90", fontSize: "13px", margin: "0 0 24px 0" }}>
          Source:{" "}
          <span style={{ color: "#5EF08A", fontWeight: 600 }}>{source}</span>
        </p>

        {/* Success state */}
        {successMsg && (
          <div
            data-ocid="leads.convert_to_client.success_state"
            style={{
              background: "rgba(94,240,138,0.12)",
              border: "1px solid rgba(94,240,138,0.35)",
              borderRadius: "8px",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5EF08A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span
              style={{ color: "#5EF08A", fontWeight: 600, fontSize: "14px" }}
            >
              {successMsg}
            </span>
          </div>
        )}

        {/* Error state */}
        {errorMsg && (
          <div
            data-ocid="leads.convert_to_client.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#f87171",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "16px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label htmlFor="ctc-name" style={labelStyle}>
                  Name
                </label>
                <input
                  id="ctc-name"
                  data-ocid="leads.convert_to_client.name_input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="ctc-email" style={labelStyle}>
                  Email
                </label>
                <input
                  id="ctc-email"
                  data-ocid="leads.convert_to_client.email_input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="ctc-phone" style={labelStyle}>
                  Phone
                </label>
                <input
                  id="ctc-phone"
                  data-ocid="leads.convert_to_client.phone_input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="ctc-services" style={labelStyle}>
                  Active Services
                </label>
                <input
                  id="ctc-services"
                  data-ocid="leads.convert_to_client.services_input"
                  type="text"
                  value={activeServices}
                  onChange={(e) => setActiveServices(e.target.value)}
                  placeholder="e.g. Website Build, SEO"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  background: "rgba(28,31,51,0.8)",
                  border: "1px solid #1C1F33",
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#7A7D90",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                data-ocid="leads.convert_to_client.save_button"
                disabled={saving}
                style={{
                  flex: 2,
                  background: saving ? "rgba(94,240,138,0.5)" : "#5EF08A",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#061209",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.15s",
                }}
              >
                {saving && (
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(6,18,9,0.3)",
                      borderTop: "2px solid #061209",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                )}
                {saving ? "Saving…" : "Save Client"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── LeadCard ─────────────────────────────────────────────────────────────────

function formatRescheduleTimestamp(ns: bigint | number): string {
  if (typeof ns === "bigint" && ns === 0n) return "—";
  if (typeof ns === "bigint" && Number.isNaN(Number(ns))) return "—";
  const ms = typeof ns === "bigint" ? Number(ns) / 1_000_000 : ns;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "Unknown time";
  return `${d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} at ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

function LeadCard({
  lead,
  index,
  onStatusChange,
  onDelete,
  onConvert,
  highlightedId,
  onAssignMeeting,
  onSendRescheduleLink,
  onFetchRescheduleHistory,
  serviceLabels,
}: {
  lead: Lead;
  index: number;
  onStatusChange: (id: string, newStatus: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
  onConvert: (lead: Lead) => void;
  highlightedId: string | null;
  onAssignMeeting: (lead: Lead) => void;
  onSendRescheduleLink: (lead: Lead) => Promise<void>;
  onFetchRescheduleHistory: (leadId: string) => Promise<(bigint | number)[]>;
  serviceLabels?: Record<string, string>;
}) {
  const [saved, setSaved] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendingReschedule, setSendingReschedule] = useState(false);
  const [rescheduleToast, setRescheduleToast] = useState<string | null>(null);
  const [rescheduleHistory, setRescheduleHistory] = useState<
    (bigint | number)[] | null
  >(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  // detailOpen: controls lazy-load drawer for reschedule history (avoids 50 concurrent fetches on mount)
  const [detailOpen, setDetailOpen] = useState(false);

  function handleOpenDetail() {
    if (detailOpen) {
      setDetailOpen(false);
      return;
    }
    setDetailOpen(true);
    // Lazy-fetch reschedule history only when drawer is first opened
    if (
      !lead.isDraft &&
      lead.status !== "draft" &&
      rescheduleHistory === null
    ) {
      setHistoryLoading(true);
      onFetchRescheduleHistory(lead.id)
        .then((h) => {
          setRescheduleHistory(h);
          setHistoryLoading(false);
        })
        .catch(() => {
          setRescheduleHistory([]);
          setHistoryLoading(false);
        });
    }
  }

  const details = parseLeadMessage(lead.message);
  const intentTag = extractIntentTag(lead.message);

  async function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setUpdating(true);
    setUpdateError(null);
    const ok = await onStatusChange(lead.id, newStatus);
    setUpdating(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setUpdateError("Failed to save — please try again");
      setTimeout(() => setUpdateError(null), 4000);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(lead.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
      setDeleteError("Delete failed — please try again");
      setTimeout(() => setDeleteError(null), 4000);
    }
  }

  // Prefer rich fields from JSON message, fall back to flat top-level fields
  const displayName = details.contact_name || lead.name || "—";
  const displayBusiness = details.business_name || lead.business || "—";
  const displayEmail = details.contact_email || lead.email || "—";
  const displayPhone = details.contact_phone || "";
  // industry key (calendar bookings use 'industry', older leads may use 'business_type')
  const displayType = details.industry || details.business_type || "";
  // Calendar-booking-specific fields
  const displayServiceType = details.service_type || "";
  const displayMonthlyRevenue = details.monthly_revenue || "";
  const displayWebsiteUrl = details.website_url || "";
  const displayBestTime = details.best_time || "";
  const displayPreferredDate = details.preferred_date || "";
  const displayPreferredTime =
    details.requested_time || details.preferred_time || "";
  // Service label map (matches HomepageCalendarBooking service IDs)
  // serviceLabels prop (from live catalog) takes precedence over the static fallback
  const SERVICE_LABELS: Record<string, string> = serviceLabels ?? {
    custom_sites: "🌐 Custom Sites",
    speedy_sites: "⚡ Speedy Sites",
    ai_receptionists: "🤖 AI Receptionists",
    cinematic_ads: "🎬 Cinematic Ads",
    product_ads: "📦 Product Ads",
    site_audit: "🔍 Professional Site Audit",
    free_consultation: "💡 Free Strategy Consultation",
  };
  const displayServiceLabel = displayServiceType
    ? (SERVICE_LABELS[displayServiceType] ?? displayServiceType)
    : "";

  const isCalendarHighlighted = highlightedId === lead.id;

  return (
    <div
      data-ocid={`leads.card.${index}`}
      data-lead-card-id={lead.id}
      style={{
        background: "rgba(10,11,20,0.95)",
        borderRadius: "8px",
        padding: "16px",
        border: isCalendarHighlighted
          ? "1px solid #5EF08A"
          : "1px solid rgba(94,240,138,0.15)",
        marginBottom: "12px",
        opacity: deleting ? 0.4 : 1,
        transition: "opacity 0.2s, border 0.3s, box-shadow 0.3s",
        boxShadow: isCalendarHighlighted
          ? "0 0 12px rgba(57,255,20,0.4), 0 0 24px rgba(57,255,20,0.2)"
          : "none",
      }}
    >
      {/* Header row: business name + delete button */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              color: "#EEF0F8",
              fontWeight: 700,
              fontSize: "15px",
              display: "block",
              marginBottom: "2px",
            }}
          >
            {displayBusiness}
          </span>
          {displayType && (
            <span
              style={{
                color: "#7A7D90",
                fontSize: "13px",
                display: "block",
                marginBottom: "6px",
              }}
            >
              {displayType}
            </span>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              flexWrap: "wrap",
            }}
          >
            <PathBadge path={lead.path} />
            {intentTag && <IntentBadge tag={intentTag} />}
            {lead.isDraft || lead.status === "draft" ? (
              <DraftBadge />
            ) : (
              <MeetingMethodBadge lead={lead} />
            )}
            {lead.convertedAt && lead.convertedAt.length > 0 && (
              <ConvertedBadge />
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title={confirmDelete ? "Click again to confirm" : "Delete lead"}
          style={{
            background: confirmDelete
              ? "rgba(239,68,68,0.2)"
              : "rgba(239,68,68,0.08)",
            border: confirmDelete
              ? "1px solid rgba(239,68,68,0.6)"
              : "1px solid rgba(239,68,68,0.2)",
            borderRadius: "6px",
            color: confirmDelete ? "#f87171" : "#ef4444",
            cursor: deleting ? "not-allowed" : "pointer",
            padding: "5px 7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: "8px",
            transition: "all 0.15s",
          }}
        >
          {confirmDelete ? (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Confirm?
            </span>
          ) : (
            <TrashIcon />
          )}
        </button>
      </div>

      <div style={{ marginTop: "10px", marginBottom: "4px" }}>
        <span
          style={{
            color: "#EEF0F8",
            fontSize: "13px",
            fontWeight: 500,
            display: "block",
            marginBottom: "2px",
          }}
        >
          {displayName}
        </span>
        <span style={{ color: "#7A7D90", fontSize: "13px", display: "block" }}>
          {displayEmail}
        </span>
        {displayPhone && (
          <span
            style={{
              color: "#7A7D90",
              fontSize: "12px",
              display: "block",
              marginTop: "2px",
            }}
          >
            📞 {displayPhone}
          </span>
        )}
        <span
          style={{
            color: "#7A7D90",
            fontSize: "12px",
            display: "block",
            marginTop: "4px",
          }}
        >
          {formatDate(lead.created_at)}
        </span>
        {/* ── Calendar booking extra fields ── */}
        {(displayPreferredDate || displayPreferredTime) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
              padding: "5px 9px",
              background: "rgba(57,255,20,0.06)",
              border: "1px solid rgba(57,255,20,0.18)",
              borderRadius: "5px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "rgba(57,255,20,0.8)",
                fontWeight: 700,
              }}
            >
              📅 Booked:
            </span>
            {displayPreferredDate && (
              <span style={{ fontSize: "11px", color: "#EEF0F8" }}>
                {displayPreferredDate}
              </span>
            )}
            {displayPreferredTime && (
              <span style={{ fontSize: "11px", color: "#EEF0F8" }}>
                at {displayPreferredTime}
              </span>
            )}
          </div>
        )}
        {displayServiceLabel && (
          <div
            style={{
              marginTop: "5px",
              padding: "4px 9px",
              background: "rgba(94,240,138,0.07)",
              border: "1px solid rgba(94,240,138,0.22)",
              borderRadius: "5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#7A7D90",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Service:
            </span>
            <span
              style={{ fontSize: "12px", color: "#5EF08A", fontWeight: 600 }}
            >
              {displayServiceLabel}
            </span>
          </div>
        )}
        {(displayMonthlyRevenue || displayWebsiteUrl || displayBestTime) && (
          <div
            style={{
              marginTop: "6px",
              padding: "8px 10px",
              background: "rgba(14,16,32,0.6)",
              border: "1px solid rgba(28,31,51,0.8)",
              borderRadius: "5px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {displayMonthlyRevenue && (
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                <span style={{ color: "#7A7D90", fontWeight: 700 }}>
                  Revenue:
                </span>{" "}
                {displayMonthlyRevenue}
              </span>
            )}
            {displayWebsiteUrl && (
              <span
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  wordBreak: "break-all",
                }}
              >
                <span style={{ color: "#7A7D90", fontWeight: 700 }}>Site:</span>{" "}
                <a
                  href={displayWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#60a5fa", textDecoration: "none" }}
                >
                  {displayWebsiteUrl}
                </a>
              </span>
            )}
            {displayBestTime && (
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                <span style={{ color: "#7A7D90", fontWeight: 700 }}>
                  Best time:
                </span>{" "}
                {displayBestTime}
              </span>
            )}
          </div>
        )}
        {/* ── Meeting Method row ── */}
        {getMeetingType(lead) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
              padding: "8px 10px",
              background:
                getMeetingType(lead) === "google_meet"
                  ? "rgba(66,133,244,0.07)"
                  : "rgba(255,165,0,0.07)",
              border:
                getMeetingType(lead) === "google_meet"
                  ? "1px solid rgba(66,133,244,0.2)"
                  : "1px solid rgba(255,165,0,0.2)",
              borderRadius: "6px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#7A7D90",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                minWidth: "max-content",
              }}
            >
              Meeting
            </span>
            {getMeetingType(lead) === "google_meet" ? (
              <span
                style={{
                  color: "#60a5fa",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                📹 Google Meet
              </span>
            ) : (
              <span
                style={{
                  color: "#fb923c",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                📞 Phone Call
              </span>
            )}
            {getMeetingType(lead) === "google_meet" && lead.meetLink && (
              <a
                href={lead.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid={`leads.meet_link.${index}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(66,133,244,0.18)",
                  border: "1px solid rgba(66,133,244,0.45)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#93c5fd",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                  transition: "background 0.15s",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open Meet
              </a>
            )}
          </div>
        )}
      </div>

      {/* Assign Meeting Time — shown only for draft leads */}
      {(lead.isDraft || lead.status === "draft") && (
        <button
          type="button"
          data-ocid={`leads.assign_meeting_button.${index}`}
          onClick={() => onAssignMeeting(lead)}
          style={{
            width: "100%",
            background: "rgba(57,255,20,0.12)",
            border: "1px solid rgba(57,255,20,0.4)",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#39FF14",
            cursor: "pointer",
            marginTop: "10px",
            letterSpacing: "0.03em",
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Assign Meeting Time
        </button>
      )}

      {/* Send Reschedule Link — only for non-draft leads */}
      {!lead.isDraft && lead.status !== "draft" && (
        <div style={{ marginTop: "10px" }}>
          {/* Toggle button to expand/collapse the reschedule actions panel */}
          <button
            type="button"
            data-ocid={`leads.detail_toggle.${index}`}
            onClick={handleOpenDetail}
            style={{
              width: "100%",
              background: detailOpen
                ? "rgba(94,240,138,0.1)"
                : "rgba(17,19,34,0.6)",
              border: `1px solid ${detailOpen ? "rgba(94,240,138,0.3)" : "#1C1F33"}`,
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: 700,
              color: detailOpen ? "#5EF08A" : "#7A7D90",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "6px",
              letterSpacing: "0.03em",
              transition: "background 0.15s, border 0.15s",
              marginBottom: detailOpen ? "8px" : "0",
            }}
          >
            <span>📋 Reschedule &amp; History</span>
            <span style={{ fontSize: "10px" }}>{detailOpen ? "▲" : "▼"}</span>
          </button>

          {detailOpen && (
            <>
              <button
                type="button"
                data-ocid={`leads.send_reschedule_button.${index}`}
                disabled={sendingReschedule}
                onClick={async () => {
                  setSendingReschedule(true);
                  setRescheduleToast(null);
                  try {
                    await onSendRescheduleLink(lead);
                    setRescheduleToast(`Reschedule link sent to ${lead.email}`);
                    setTimeout(() => setRescheduleToast(null), 4000);
                    // Refresh history after successful send
                    onFetchRescheduleHistory(lead.id)
                      .then((h) => {
                        setRescheduleHistory(h);
                        setHistoryLoading(false);
                      })
                      .catch(() => {
                        setHistoryLoading(false);
                      });
                  } catch {
                    setRescheduleToast("Failed to send — please try again");
                    setTimeout(() => setRescheduleToast(null), 4000);
                  }
                  setSendingReschedule(false);
                }}
                style={{
                  width: "100%",
                  background: "rgba(57,255,20,0.06)",
                  border: "1px solid rgba(57,255,20,0.35)",
                  borderRadius: "6px",
                  padding: "7px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#39FF14",
                  cursor: sendingReschedule ? "not-allowed" : "pointer",
                  opacity: sendingReschedule ? 0.6 : 1,
                  letterSpacing: "0.03em",
                  transition: "background 0.15s, opacity 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {sendingReschedule
                  ? "⏳ Sending..."
                  : "📩 Send Reschedule Link"}
              </button>
              {lead.rescheduleLinkSentAt && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "11px",
                    color: "#7A7D90",
                    fontStyle: "italic",
                  }}
                >
                  Last sent:{" "}
                  {!lead.rescheduleLinkSentAt ||
                  lead.rescheduleLinkSentAt === 0n
                    ? "Never"
                    : `${new Date(Number(lead.rescheduleLinkSentAt / 1_000_000n)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date(Number(lead.rescheduleLinkSentAt / 1_000_000n)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`}
                </p>
              )}
              {rescheduleToast && (
                <div
                  data-ocid={`leads.reschedule_toast.${index}`}
                  style={{
                    marginTop: "6px",
                    padding: "7px 12px",
                    background: rescheduleToast.startsWith("Failed")
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(57,255,20,0.08)",
                    border: rescheduleToast.startsWith("Failed")
                      ? "1px solid rgba(239,68,68,0.35)"
                      : "1px solid rgba(57,255,20,0.3)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: rescheduleToast.startsWith("Failed")
                      ? "#f87171"
                      : "#39FF14",
                  }}
                >
                  {rescheduleToast.startsWith("Failed") ? "✕" : "✓"}{" "}
                  {rescheduleToast}
                </div>
              )}

              {/* ── Reschedule History Log ── */}
              <div
                data-ocid={`leads.reschedule_history.${index}`}
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  background: "rgba(14,16,32,0.6)",
                  border: "1px solid rgba(28,31,51,0.8)",
                  borderRadius: "6px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 7px 0",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Reschedule History
                </p>
                {historyLoading ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: "rgba(122,125,144,0.7)",
                      fontStyle: "italic",
                    }}
                  >
                    Loading…
                  </p>
                ) : !rescheduleHistory || rescheduleHistory.length === 0 ? (
                  <p
                    data-ocid={`leads.reschedule_history.empty_state.${index}`}
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: "rgba(122,125,144,0.6)",
                      fontStyle: "italic",
                    }}
                  >
                    No reschedule links sent yet
                  </p>
                ) : (
                  <ul
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {rescheduleHistory.map((ts) => (
                      <li
                        key={String(ts)}
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          lineHeight: 1.4,
                          paddingLeft: "10px",
                          borderLeft: "2px solid rgba(57,255,20,0.25)",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(57,255,20,0.7)",
                            fontWeight: 600,
                          }}
                        >
                          Reschedule link sent
                        </span>
                        {" — "}
                        {formatRescheduleTimestamp(ts)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </> /* end detailOpen */
          )}
        </div>
      )}

      {/* Convert to Client button */}
      <button
        type="button"
        data-ocid={`leads.convert_to_client_button.${index}`}
        onClick={() => onConvert(lead)}
        style={{
          width: "100%",
          background: "rgba(94,240,138,0.1)",
          border: "1px solid rgba(94,240,138,0.35)",
          borderRadius: "6px",
          padding: "7px 12px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#5EF08A",
          cursor: "pointer",
          marginTop: "10px",
          marginBottom: "6px",
          letterSpacing: "0.03em",
          transition: "background 0.15s",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(94,240,138,0.18)";
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(94,240,138,0.18)";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(94,240,138,0.1)";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(94,240,138,0.1)";
        }}
      >
        ＋ Convert to Client
      </button>

      <div style={{ marginTop: "6px" }}>
        <select
          data-ocid={`leads.status.select.${index}`}
          value={lead.status}
          onChange={handleChange}
          disabled={updating}
          style={{
            width: "100%",
            border: "1px solid #1C1F33",
            borderRadius: "6px",
            padding: "6px 8px",
            fontSize: "13px",
            color: "#EEF0F8",
            background: updating ? "rgba(19,21,36,0.5)" : "rgba(19,21,36,1)",
            cursor: updating ? "not-allowed" : "pointer",
            outline: "none",
          }}
        >
          {COLUMNS.map((col) => (
            <option key={col.key} value={col.key}>
              {STATUS_LABELS[col.key]}
            </option>
          ))}
        </select>
        {saved && (
          <span
            style={{
              display: "block",
              marginTop: "4px",
              color: "#5EF08A",
              fontSize: "12px",
              fontWeight: 500,
              transition: "opacity 0.5s",
            }}
          >
            ✓ Saved
          </span>
        )}
        {updateError && (
          <span
            style={{
              display: "block",
              marginTop: "4px",
              color: "#f87171",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            ✕ {updateError}
          </span>
        )}
      </div>
      {deleteError && (
        <div
          style={{
            marginTop: "8px",
            padding: "6px 10px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: "6px",
            color: "#f87171",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          ✕ {deleteError}
        </div>
      )}
    </div>
  );
}

// ── Inline Availability Picker (shared by Manual Book modal + Assign Meeting drawer) ──

interface SlotPickerProps {
  availability: AvailabilitySettings | null;
  onSelect: (
    date: string,
    time: string,
    method: "phone" | "google_meet",
  ) => void;
  twoHourBuffer?: boolean;
}

function SlotPicker({
  availability,
  onSelect,
  twoHourBuffer = true,
}: SlotPickerProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"phone" | "google_meet">(
    "phone",
  );

  // Days-of-week key map (Sunday=0)
  const DOW_KEYS: (keyof WeeklySchedule)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  // Generate available dates (next 30 days)
  const availableDates: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (availability) {
      const dow = DOW_KEYS[d.getDay()];
      const sched = availability.weeklySchedule[dow];
      if (!sched?.isOpen) continue;
      if (availability.blockedDates.includes(ymd)) continue;
    }
    availableDates.push(ymd);
  }

  // Generate time slots for selected date
  const timeSlots: string[] = [];
  if (selectedDate && availability) {
    const d = new Date(`${selectedDate}T00:00:00`);
    const dow = DOW_KEYS[d.getDay()];
    const sched = availability.weeklySchedule[dow];
    if (sched?.isOpen) {
      for (let h = sched.startHour; h < sched.endHour; h++) {
        // 2-hour buffer for today
        if (twoHourBuffer) {
          const slotMs = new Date(
            `${selectedDate}T${String(h).padStart(2, "0")}:00:00`,
          ).getTime();
          const bufferMs = today.getTime() + 2 * 60 * 60 * 1000;
          if (slotMs < bufferMs) continue;
        }
        const label =
          h === 0
            ? "12:00 AM"
            : h < 12
              ? `${h}:00 AM`
              : h === 12
                ? "12:00 PM"
                : `${h - 12}:00 PM`;
        timeSlots.push(label);
      }
    }
  } else if (selectedDate && !availability) {
    // No availability config — offer 9 AM to 5 PM
    for (let h = 9; h < 17; h++) {
      if (twoHourBuffer) {
        const slotMs = new Date(
          `${selectedDate}T${String(h).padStart(2, "0")}:00:00`,
        ).getTime();
        const bufferMs = today.getTime() + 2 * 60 * 60 * 1000;
        if (slotMs < bufferMs) continue;
      }
      const label =
        h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
      timeSlots.push(label);
    }
  }

  const canConfirm = selectedDate && selectedTime;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Meeting Method */}
      <div>
        <p
          style={{
            color: "#7A7D90",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 8px 0",
          }}
        >
          Meeting Method
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["phone", "google_meet"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMethod(m)}
              style={{
                flex: 1,
                background:
                  selectedMethod === m
                    ? m === "phone"
                      ? "rgba(255,165,0,0.18)"
                      : "rgba(66,133,244,0.18)"
                    : "rgba(17,19,34,0.9)",
                border:
                  selectedMethod === m
                    ? m === "phone"
                      ? "1.5px solid rgba(255,165,0,0.6)"
                      : "1.5px solid rgba(66,133,244,0.6)"
                    : "1px solid #1C1F33",
                borderRadius: "7px",
                padding: "9px 10px",
                fontSize: "13px",
                fontWeight: 700,
                color:
                  selectedMethod === m
                    ? m === "phone"
                      ? "#fb923c"
                      : "#60a5fa"
                    : "#7A7D90",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {m === "phone" ? "📞" : "📹"}
              {m === "phone" ? "Phone Call" : "Google Meet"}
            </button>
          ))}
        </div>
      </div>

      {/* Date picker */}
      <div>
        <p
          style={{
            color: "#7A7D90",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 8px 0",
          }}
        >
          Pick a Date
        </p>
        {availableDates.length === 0 ? (
          <p style={{ color: "#f87171", fontSize: "12px" }}>
            No available dates in the next 30 days. Check your calendar
            settings.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {availableDates.map((d) => {
              const dt = new Date(`${d}T12:00:00`);
              const label = dt.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const isSelected = selectedDate === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setSelectedTime("");
                  }}
                  style={{
                    background: isSelected
                      ? "rgba(57,255,20,0.18)"
                      : "rgba(17,19,34,0.9)",
                    border: isSelected
                      ? "1.5px solid #39FF14"
                      : "1px solid #1C1F33",
                    borderRadius: "7px",
                    padding: "7px 12px",
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#39FF14" : "#EEF0F8",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p
            style={{
              color: "#7A7D90",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 8px 0",
            }}
          >
            Pick a Time
          </p>
          {timeSlots.length === 0 ? (
            <p style={{ color: "#f87171", fontSize: "12px" }}>
              No slots available for this date (all within 2-hour buffer or
              outside hours).
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {timeSlots.map((t) => {
                const isSelected = selectedTime === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    style={{
                      background: isSelected
                        ? "rgba(57,255,20,0.18)"
                        : "rgba(17,19,34,0.9)",
                      border: isSelected
                        ? "1.5px solid #39FF14"
                        : "1px solid #1C1F33",
                      borderRadius: "7px",
                      padding: "7px 12px",
                      fontSize: "12px",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#39FF14" : "#EEF0F8",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm button */}
      <button
        type="button"
        disabled={!canConfirm}
        onClick={() =>
          canConfirm && onSelect(selectedDate, selectedTime, selectedMethod)
        }
        style={{
          background: canConfirm ? "#39FF14" : "rgba(57,255,20,0.15)",
          border: canConfirm ? "none" : "1px solid rgba(57,255,20,0.3)",
          borderRadius: "7px",
          padding: "11px",
          fontSize: "13px",
          fontWeight: 700,
          color: canConfirm ? "#061209" : "#39FF14",
          cursor: canConfirm ? "pointer" : "not-allowed",
          transition: "all 0.15s",
          opacity: canConfirm ? 1 : 0.6,
        }}
      >
        {canConfirm
          ? `Confirm: ${selectedDate} at ${selectedTime}`
          : "Select a date and time above"}
      </button>
    </div>
  );
}

// ── Availability Types ──────────────────────────────────────────────────────

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

const DAY_KEYS: (keyof WeeklySchedule)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<keyof WeeklySchedule, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DEFAULT_AVAILABILITY: AvailabilitySettings = {
  weeklySchedule: {
    monday: { isOpen: true, startHour: 9, endHour: 17 },
    tuesday: { isOpen: true, startHour: 9, endHour: 17 },
    wednesday: { isOpen: true, startHour: 9, endHour: 17 },
    thursday: { isOpen: true, startHour: 9, endHour: 17 },
    friday: { isOpen: true, startHour: 9, endHour: 17 },
    saturday: { isOpen: false, startHour: 9, endHour: 17 },
    sunday: { isOpen: false, startHour: 9, endHour: 17 },
  },
  blockedDates: [],
};

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminLeadsPage() {
  const { actor, isFetching } = useActor();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [calendarHighlightedId, setCalendarHighlightedId] = useState<
    string | null
  >(null);
  const [products, setProducts] = useState<Array<{ id: bigint; name: string }>>(
    [],
  );
  useEffect(() => {
    if (isFetching || !actor) return;
    actor
      .getAllProductsAdmin()
      .then(setProducts)
      .catch(() => {});
  }, [isFetching, actor]);

  // ── Status filter chips state (all active by default) ──
  // Possible status values: "New", "Contacted", "Qualified", "Closed", "Draft", "Cancelled"
  const ALL_STATUS_FILTERS = [
    "New",
    "Contacted",
    "Qualified",
    "Closed",
    "Draft",
    "Cancelled",
  ] as const;
  type StatusFilter = (typeof ALL_STATUS_FILTERS)[number];
  const [activeFilters, setActiveFilters] = useState<Set<StatusFilter>>(
    () => new Set(ALL_STATUS_FILTERS),
  );

  function toggleFilter(status: StatusFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  function selectAll() {
    setActiveFilters(new Set(ALL_STATUS_FILTERS));
  }

  const isAllActive = activeFilters.size === ALL_STATUS_FILTERS.length;

  // Color coding per status chip
  const FILTER_CHIP_COLORS: Record<
    StatusFilter,
    { active: string; border: string; text: string; bg: string }
  > = {
    New: {
      active: "rgba(57,255,20,0.18)",
      border: "rgba(57,255,20,0.6)",
      text: "#39FF14",
      bg: "rgba(57,255,20,0.06)",
    },
    Contacted: {
      active: "rgba(59,130,246,0.2)",
      border: "rgba(59,130,246,0.6)",
      text: "#60a5fa",
      bg: "rgba(59,130,246,0.06)",
    },
    Qualified: {
      active: "rgba(250,204,21,0.2)",
      border: "rgba(250,204,21,0.6)",
      text: "#fbbf24",
      bg: "rgba(250,204,21,0.06)",
    },
    Closed: {
      active: "rgba(239,68,68,0.18)",
      border: "rgba(239,68,68,0.55)",
      text: "#f87171",
      bg: "rgba(239,68,68,0.06)",
    },
    Draft: {
      active: "rgba(107,114,128,0.22)",
      border: "rgba(107,114,128,0.55)",
      text: "#9ca3af",
      bg: "rgba(107,114,128,0.06)",
    },
    Cancelled: {
      active: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.45)",
      text: "#fca5a5",
      bg: "rgba(239,68,68,0.05)",
    },
  };

  // ── Manual Book state ──
  const [manualBookOpen, setManualBookOpen] = useState(false);

  // ── Assign Meeting state (for draft leads) ──
  const [assignTarget, setAssignTarget] = useState<Lead | null>(null);

  // ── Toast state ──
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }

  // ── Availability state ──
  const [availOpen, setAvailOpen] = useState(false);
  const [initialAvailFetched, setInitialAvailFetched] = useState(false);

  // Timezone state (persisted in localStorage so Quick Book timezone is remembered)
  const TIMEZONE_STORAGE_KEY = "imperidome_admin_timezone";
  const TIMEZONE_OPTIONS = [
    { value: "America/New_York", label: "Eastern (America/New_York)" },
    { value: "America/Chicago", label: "Central (America/Chicago)" },
    { value: "America/Denver", label: "Mountain (America/Denver)" },
    { value: "America/Los_Angeles", label: "Pacific (America/Los_Angeles)" },
    { value: "America/Phoenix", label: "Arizona (America/Phoenix)" },
    { value: "UTC", label: "UTC" },
  ];
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [adminTimezone, setAdminTimezone] = useState<string>(
    () =>
      localStorage.getItem(TIMEZONE_STORAGE_KEY) ||
      detectedTimezone ||
      "America/New_York",
  );
  const [availability, setAvailability] =
    useState<AvailabilitySettings>(DEFAULT_AVAILABILITY);
  const [availLoading, setAvailLoading] = useState(false);
  const [availSaving, setAvailSaving] = useState(false);
  const [availSaveMsg, setAvailSaveMsg] = useState<string | null>(null);
  const [blockDateInput, setBlockDateInput] = useState("");
  const [blockDateError, setBlockDateError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    (actor as backendInterface)
      .getLeads()
      .then((result: unknown) => {
        setLeads(result as Lead[]);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Failed to load leads: ${msg}`);
        setLoading(false);
      });
  }, [actor, isFetching]);

  // Fetch availability on page load (so Manual Book/Assign Meeting modals always use real settings)
  useEffect(() => {
    if (!actor || isFetching || initialAvailFetched) return;
    setInitialAvailFetched(true);
    (actor as backendInterface)
      .getAvailability()
      .then((result: unknown) => {
        if (result && typeof result === "object") {
          setAvailability(result as AvailabilitySettings);
        }
      })
      .catch((err) => {
        // Use defaults if backend not ready yet
        if (import.meta.env.DEV) {
          console.warn("getAvailability failed, using defaults:", err);
        }
      });
  }, [actor, isFetching, initialAvailFetched]);

  // Also re-fetch when the panel is explicitly opened/reopened
  useEffect(() => {
    if (!availOpen || !actor || isFetching) return;
    setAvailLoading(true);
    (actor as backendInterface)
      .getAvailability()
      .then((result: unknown) => {
        if (result && typeof result === "object") {
          setAvailability(result as AvailabilitySettings);
        }
        setAvailLoading(false);
      })
      .catch(() => {
        setAvailLoading(false);
      });
  }, [availOpen, actor, isFetching]);

  async function handleStatusChange(
    id: string,
    newStatus: string,
  ): Promise<boolean> {
    if (!actor) return false;
    const prevLeads = [...leads];
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, status: newStatus } : lead,
      ),
    );
    try {
      const statusResult = await (actor as backendInterface).updateLeadStatus(
        id,
        newStatus,
      );
      if ("err" in statusResult) {
        showToast("Failed to update lead status. Please try again.", "error");
      }
      return true;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to update lead status:", err);
      }
      setLeads(prevLeads);
      showToast("Failed to update lead status. Please try again.", "error");
      return false;
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!actor) throw new Error("Actor not ready");
    try {
      await (actor as backendInterface).deleteLead(id);
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to delete lead:", err);
      }
      showToast("Failed to delete lead. Please try again.", "error");
    }
  }

  function updateDay(day: keyof WeeklySchedule, patch: Partial<DaySchedule>) {
    setAvailability((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: { ...prev.weeklySchedule[day], ...patch },
      },
    }));
  }

  async function handleSaveAvailability() {
    if (!actor) return;
    setAvailSaving(true);
    setAvailSaveMsg(null);
    try {
      // Map local number hours to bigint as required by the backend DaySchedule type
      const backendAvailability = {
        ...availability,
        weeklySchedule: Object.fromEntries(
          Object.entries(availability.weeklySchedule).map(([day, sched]) => [
            day,
            {
              isOpen: sched.isOpen,
              startHour: BigInt(sched.startHour),
              endHour: BigInt(sched.endHour),
            },
          ]),
        ) as unknown as import("../../backend.d").WeeklySchedule,
      };
      await (actor as backendInterface).setAvailability(backendAvailability);
      setAvailSaveMsg("✓ Availability saved");
      setTimeout(() => setAvailSaveMsg(null), 3500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAvailSaveMsg(`✕ Failed to save: ${msg}`);
      setTimeout(() => setAvailSaveMsg(null), 5000);
    }
    setAvailSaving(false);
  }

  async function handleBlockDate() {
    if (!blockDateInput) {
      setBlockDateError("Please pick a date first.");
      return;
    }
    if (availability.blockedDates.includes(blockDateInput)) {
      setBlockDateError("That date is already blocked.");
      return;
    }
    setBlockDateError(null);
    // Optimistic update
    setAvailability((prev) => ({
      ...prev,
      blockedDates: [...prev.blockedDates, blockDateInput].sort(),
    }));
    setBlockDateInput("");
    if (actor) {
      try {
        await (actor as backendInterface).blockDate(blockDateInput);
      } catch (err) {
        showToast("Failed to update availability. Please try again.", "error");
        if (import.meta.env.DEV) {
          console.error(err);
        }
      }
    }
  }

  async function handleUnblockDate(date: string) {
    // Optimistic update
    setAvailability((prev) => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((d) => d !== date),
    }));
    if (actor) {
      try {
        await (actor as backendInterface).unblockDate(date);
      } catch (err) {
        showToast("Failed to update availability. Please try again.", "error");
        if (import.meta.env.DEV) {
          console.error(err);
        }
      }
    }
  }

  async function handleConvertSave(
    name: string,
    email: string,
    phone: string,
    activeServices: string,
  ): Promise<string | null> {
    if (!actor) return null;
    try {
      const clientId = await (actor as backendInterface).addClient(
        name,
        email,
        phone,
        "Lead",
        activeServices ? [activeServices] : [],
        null,
      );
      // Stamp convertedAt on the lead record
      if (convertLead?.id) {
        try {
          await (actor as backendInterface).convertLeadToClient(
            convertLead.id,
            "",
            "",
            "",
            "Lead",
            [],
            null,
          );
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn("convertLeadToClient stamp failed:", e);
          }
        }
        // Refresh leads list so convertedAt badge shows immediately
        try {
          const updated = await (actor as backendInterface).getLeads();
          setLeads(updated as Lead[]);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn("Leads refresh after conversion failed:", e);
          }
        }
      }
      return typeof clientId === "string" ? clientId : String(clientId);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Failed to create client:", err);
      }
      return null;
    }
  }

  // ── Fetch reschedule history for a lead ──
  async function handleFetchRescheduleHistory(
    leadId: string,
  ): Promise<(bigint | number)[]> {
    if (!actor) return [];
    try {
      const result = await (actor as backendInterface).getRescheduleHistory(
        leadId,
      );
      return Array.isArray(result) ? result : [];
    } catch {
      return [];
    }
  }

  // Filter leads by search query (name or business name, case-insensitive)
  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const details = parseLeadMessage(lead.message);
    const name = (details.contact_name || lead.name || "").toLowerCase();
    const business = (
      details.business_name ||
      lead.business ||
      ""
    ).toLowerCase();
    return name.includes(q) || business.includes(q);
  });

  // Case-insensitive bucketing: match leads to columns regardless of stored case
  // Draft column: leads where isDraft === true OR status === 'draft'
  // Cancelled column: leads where status === 'Cancelled' or 'cancelled'
  const leadsByStatus: Record<string, Lead[]> = {};
  for (const col of COLUMNS) {
    if (col.key === "Draft") {
      leadsByStatus[col.key] = filteredLeads.filter(
        (l) => l.isDraft || l.status.toLowerCase() === "draft",
      );
    } else if (col.key === "Cancelled") {
      leadsByStatus[col.key] = filteredLeads.filter(
        (l) => !l.isDraft && l.status.toLowerCase() === "cancelled",
      );
    } else {
      leadsByStatus[col.key] = filteredLeads.filter(
        (l) =>
          !l.isDraft &&
          l.status.toLowerCase() !== "draft" &&
          l.status.toLowerCase() === col.key.toLowerCase(),
      );
    }
  }

  let cardIndex = 0;

  // All leads go to calendar — draft leads show with gray/dashed styling
  // Apply status filter chips: "Draft" filter maps to isDraft/status==draft
  const calendarLeads = filteredLeads.filter((l) => {
    const isDraft = l.isDraft || l.status.toLowerCase() === "draft";
    if (isDraft) return activeFilters.has("Draft");
    const isCancelled = l.status.toLowerCase() === "cancelled";
    if (isCancelled) return activeFilters.has("Cancelled");
    // Map stored status to filter key (case-insensitive)
    const matchedKey = ALL_STATUS_FILTERS.find(
      (k) =>
        k !== "Draft" &&
        k !== "Cancelled" &&
        k.toLowerCase() === l.status.toLowerCase(),
    );
    if (matchedKey) return activeFilters.has(matchedKey);
    // Unknown status falls through as "New"
    return activeFilters.has("New");
  });
  const draftLeads = filteredLeads.filter(
    (l) => l.isDraft || l.status === "draft",
  );

  // Build prefill data for convert modal
  const convertDetails = convertLead
    ? parseLeadMessage(convertLead.message)
    : null;
  const convertPrefillName = convertDetails
    ? convertDetails.contact_name || convertLead?.name || ""
    : "";
  const convertPrefillEmail = convertDetails
    ? convertDetails.contact_email || convertLead?.email || ""
    : "";
  const convertPrefillService = convertDetails
    ? convertDetails.business_name || convertLead?.business || ""
    : "";

  // ── Shared style tokens for the availability panel ──
  const avInputStyle: CSSProperties = {
    background: "rgba(14,16,32,0.9)",
    border: "1px solid #1C1F33",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "13px",
    color: "#EEF0F8",
    outline: "none",
  };

  // ── Manual Book handlers ──
  async function handleManualBookDraft(data: {
    name: string;
    email: string;
    phone: string;
    service: string;
    notes: string;
  }): Promise<string | null> {
    if (!actor) return null;
    try {
      const result = await (actor as backendInterface).createDraftLead(
        data.name,
        data.email,
        data.phone,
        data.service,
      );
      if (result?.ok) {
        // Refresh leads list
        const updated = await (actor as backendInterface).getLeads();
        setLeads(updated as Lead[]);
        return result.leadId as string;
      }
      return null;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("createDraftLead failed:", err);
      }
      return null;
    }
  }

  async function handleAssignMeeting(
    leadId: string,
    date: string,
    time: string,
    method: "phone" | "google_meet",
  ): Promise<boolean> {
    if (!actor) return false;
    try {
      const result = await (actor as backendInterface).assignMeetingToLead(
        leadId,
        date,
        time,
        method,
      );
      if (result?.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  isDraft: false,
                  status: l.status === "draft" ? "New" : l.status,
                  meetingMethod: method,
                  meetLink: result.meetLink || "",
                }
              : l,
          ),
        );
        return true;
      }
      return false;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("assignMeetingToLead failed:", err);
      }
      return false;
    }
  }

  return (
    <AdminLayout pageTitle="Lead Pipeline">
      {/* ── Toast notification ── */}
      {toast && (
        <div
          data-ocid="leads.toast"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 20000,
            background:
              toast.type === "success"
                ? "rgba(17,28,19,0.97)"
                : "rgba(28,10,10,0.97)",
            border: `1px solid ${toast.type === "success" ? "rgba(94,240,138,0.5)" : "rgba(239,68,68,0.5)"}`,
            borderRadius: "10px",
            padding: "14px 20px",
            fontSize: "13px",
            fontWeight: 600,
            color: toast.type === "success" ? "#5EF08A" : "#f87171",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            maxWidth: "360px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ flexShrink: 0, fontSize: "16px" }}>
            {toast.type === "success" ? "✓" : "✕"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* ── Configure Calendar toggle ── */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "flex-start",
        }}
      >
        {/* Manual Book button */}
        <button
          type="button"
          data-ocid="leads.manual_book.open_modal_button"
          onClick={() => setManualBookOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(57,255,20,0.12)",
            border: "1px solid rgba(57,255,20,0.45)",
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#39FF14",
            cursor: "pointer",
            letterSpacing: "0.04em",
            transition: "background 0.15s, border 0.15s",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log New Lead
        </button>

        <button
          type="button"
          data-ocid="leads.configure_calendar.toggle"
          onClick={() => setAvailOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: availOpen
              ? "rgba(94,240,138,0.15)"
              : "rgba(94,240,138,0.07)",
            border: `1px solid ${availOpen ? "rgba(94,240,138,0.55)" : "rgba(94,240,138,0.25)"}`,
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#5EF08A",
            cursor: "pointer",
            letterSpacing: "0.04em",
            transition: "background 0.15s, border 0.15s",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Configure Calendar
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              transform: availOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* ── Availability Settings Panel ── */}
        {availOpen && (
          <div
            data-ocid="leads.availability.panel"
            style={{
              marginTop: "12px",
              background: "rgba(14,16,32,0.95)",
              border: "1px solid #1C1F33",
              borderRadius: "10px",
              padding: "24px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                color: "#EEF0F8",
                fontSize: "15px",
                fontWeight: 700,
                margin: "0 0 20px 0",
                letterSpacing: "0.02em",
              }}
            >
              Availability Settings
            </h3>

            {availLoading ? (
              <div
                data-ocid="leads.availability.loading_state"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#7A7D90",
                  fontSize: "14px",
                  padding: "16px 0",
                }}
              >
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #1C1F33",
                    borderTop: "2px solid #5EF08A",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Loading availability…
              </div>
            ) : (
              <>
                {/* ── Weekly Schedule ── */}
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 12px 0",
                  }}
                >
                  Weekly Schedule
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "28px",
                  }}
                >
                  {DAY_KEYS.map((day) => {
                    const ds = availability.weeklySchedule[day];
                    return (
                      <div
                        key={day}
                        data-ocid={`leads.availability.day.${day}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                          background: "rgba(17,19,34,0.7)",
                          border: "1px solid #1C1F33",
                          borderRadius: "7px",
                          padding: "10px 14px",
                        }}
                      >
                        {/* Toggle */}
                        <label
                          htmlFor={`avail-toggle-${day}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            minWidth: "120px",
                          }}
                        >
                          <span
                            style={{
                              position: "relative",
                              display: "inline-block",
                              width: "36px",
                              height: "20px",
                              flexShrink: 0,
                            }}
                          >
                            <input
                              id={`avail-toggle-${day}`}
                              data-ocid={`leads.availability.toggle.${day}`}
                              type="checkbox"
                              checked={ds.isOpen}
                              onChange={(e) =>
                                updateDay(day, { isOpen: e.target.checked })
                              }
                              style={{
                                opacity: 0,
                                width: 0,
                                height: 0,
                                position: "absolute",
                              }}
                            />
                            <span
                              onClick={() =>
                                updateDay(day, { isOpen: !ds.isOpen })
                              }
                              onKeyDown={(e) => {
                                if (e.key === " " || e.key === "Enter")
                                  updateDay(day, { isOpen: !ds.isOpen });
                              }}
                              role="switch"
                              aria-checked={ds.isOpen}
                              tabIndex={0}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: ds.isOpen
                                  ? "#5EF08A"
                                  : "rgba(122,125,144,0.3)",
                                borderRadius: "10px",
                                cursor: "pointer",
                                transition: "background 0.2s",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                top: "3px",
                                left: ds.isOpen ? "19px" : "3px",
                                width: "14px",
                                height: "14px",
                                background: "#fff",
                                borderRadius: "50%",
                                transition: "left 0.2s",
                                pointerEvents: "none",
                              }}
                            />
                          </span>
                          <span
                            style={{
                              color: ds.isOpen ? "#EEF0F8" : "#7A7D90",
                              fontSize: "13px",
                              fontWeight: 600,
                              transition: "color 0.15s",
                              userSelect: "none",
                            }}
                          >
                            {DAY_LABELS[day]}
                          </span>
                        </label>

                        {/* Open badge */}
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: ds.isOpen
                              ? "rgba(94,240,138,0.12)"
                              : "rgba(122,125,144,0.12)",
                            color: ds.isOpen ? "#5EF08A" : "#7A7D90",
                            border: `1px solid ${ds.isOpen ? "rgba(94,240,138,0.3)" : "rgba(122,125,144,0.2)"}`,
                            minWidth: "54px",
                            textAlign: "center",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {ds.isOpen ? "OPEN" : "CLOSED"}
                        </span>

                        {/* Time pickers */}
                        {ds.isOpen && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{ color: "#7A7D90", fontSize: "12px" }}
                            >
                              From
                            </span>
                            <select
                              data-ocid={`leads.availability.start.${day}`}
                              value={ds.startHour}
                              onChange={(e) =>
                                updateDay(day, {
                                  startHour: Number(e.target.value),
                                })
                              }
                              style={avInputStyle}
                            >
                              {[
                                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
                                14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                              ].map((h) => (
                                <option key={`start-h${h}`} value={h}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                            <span
                              style={{ color: "#7A7D90", fontSize: "12px" }}
                            >
                              to
                            </span>
                            <select
                              data-ocid={`leads.availability.end.${day}`}
                              value={ds.endHour}
                              onChange={(e) =>
                                updateDay(day, {
                                  endHour: Number(e.target.value),
                                })
                              }
                              style={avInputStyle}
                            >
                              {[
                                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
                                14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                              ].map((h) => (
                                <option key={`end-h${h}`} value={h}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Block Dates ── */}
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 12px 0",
                  }}
                >
                  Block Specific Dates
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                  }}
                >
                  <input
                    data-ocid="leads.availability.block_date_input"
                    type="date"
                    value={blockDateInput}
                    onChange={(e) => {
                      setBlockDateInput(e.target.value);
                      setBlockDateError(null);
                    }}
                    style={{
                      ...avInputStyle,
                      padding: "6px 10px",
                      colorScheme: "dark",
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="leads.availability.block_date_button"
                    onClick={handleBlockDate}
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      border: "1px solid rgba(239,68,68,0.35)",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#f87171",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.22)";
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.22)";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.12)";
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.12)";
                    }}
                  >
                    Block Date
                  </button>
                </div>

                {blockDateError && (
                  <p
                    data-ocid="leads.availability.block_date.error_state"
                    style={{
                      color: "#f87171",
                      fontSize: "12px",
                      margin: "0 0 10px 0",
                    }}
                  >
                    {blockDateError}
                  </p>
                )}

                {/* Blocked dates chips */}
                {availability.blockedDates.length > 0 ? (
                  <div
                    data-ocid="leads.availability.blocked_dates.list"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "24px",
                    }}
                  >
                    {availability.blockedDates.map((date) => (
                      <span
                        key={date}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "20px",
                          padding: "4px 10px 4px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#f87171",
                        }}
                      >
                        {date}
                        <button
                          type="button"
                          data-ocid={`leads.availability.unblock.${date}`}
                          onClick={() => handleUnblockDate(date)}
                          aria-label={`Unblock ${date}`}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#f87171",
                            padding: "0",
                            lineHeight: 1,
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            opacity: 0.7,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "13px",
                      fontStyle: "italic",
                      marginBottom: "24px",
                    }}
                  >
                    No dates blocked.
                  </p>
                )}

                {/* ── Timezone ── */}
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 10px 0",
                  }}
                >
                  Timezone
                </p>
                <div style={{ marginBottom: "28px" }}>
                  <select
                    data-ocid="leads.availability.timezone_select"
                    value={adminTimezone}
                    onChange={(e) => {
                      setAdminTimezone(e.target.value);
                      localStorage.setItem(
                        TIMEZONE_STORAGE_KEY,
                        e.target.value,
                      );
                    }}
                    style={{
                      ...avInputStyle,
                      width: "100%",
                      padding: "8px 12px",
                      cursor: "pointer",
                      maxWidth: "360px",
                    }}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                    {!TIMEZONE_OPTIONS.find(
                      (t) => t.value === adminTimezone,
                    ) && (
                      <option value={adminTimezone}>
                        {adminTimezone} (detected)
                      </option>
                    )}
                  </select>
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: "11px",
                      marginTop: "5px",
                    }}
                  >
                    Detected: {detectedTimezone} — Quick Book slots use this
                    timezone.
                  </p>
                </div>

                {/* ── Save button ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    data-ocid="leads.availability.save_button"
                    onClick={handleSaveAvailability}
                    disabled={availSaving}
                    style={{
                      background: availSaving
                        ? "rgba(94,240,138,0.5)"
                        : "#5EF08A",
                      border: "none",
                      borderRadius: "7px",
                      padding: "10px 22px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#061209",
                      cursor: availSaving ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "background 0.15s",
                    }}
                  >
                    {availSaving && (
                      <span
                        style={{
                          width: "13px",
                          height: "13px",
                          border: "2px solid rgba(6,18,9,0.3)",
                          borderTop: "2px solid #061209",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                    )}
                    {availSaving ? "Saving…" : "Save Availability"}
                  </button>
                  {availSaveMsg && (
                    <span
                      data-ocid={`leads.availability.${
                        availSaveMsg.startsWith("✓")
                          ? "success_state"
                          : "error_state"
                      }`}
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: availSaveMsg.startsWith("✓")
                          ? "#5EF08A"
                          : "#f87171",
                      }}
                    >
                      {availSaveMsg}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      {!loading && !error && (
        <div
          data-ocid="leads.search.container"
          style={{
            marginBottom: "20px",
            maxWidth: "400px",
          }}
        >
          <div style={{ position: "relative" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7A7D90"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Search"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              data-ocid="leads.search.input"
              type="text"
              placeholder="Search by name or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(17,19,34,0.9)",
                border: "1px solid #1C1F33",
                borderRadius: "8px",
                padding: "10px 12px 10px 38px",
                fontSize: "14px",
                color: "#EEF0F8",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#7A7D90",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "2px",
                }}
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <p style={{ color: "#7A7D90", fontSize: "12px", marginTop: "6px" }}>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}{" "}
              found
            </p>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div
          data-ocid="leads.loading_state"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            color: "#7A7D90",
            fontSize: "15px",
            gap: "10px",
          }}
        >
          <span
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #1C1F33",
              borderTop: "2px solid #5EF08A",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Loading leads…
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          data-ocid="leads.error_state"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            padding: "16px 20px",
            color: "#f87171",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Board ── */}
      {!loading && !error && (
        <div
          data-ocid="leads.board.panel"
          style={{ overflowX: "auto", paddingBottom: "24px" }}
        >
          <div
            style={{ display: "flex", gap: "16px", minWidth: "max-content" }}
          >
            {COLUMNS.map((col) => {
              const colLeads = leadsByStatus[col.key] ?? [];
              const isGray = col.colorScheme === "gray";
              const isRed = col.colorScheme === "red";
              const headerBg = isGray
                ? "rgba(107,114,128,0.1)"
                : isRed
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(94,240,138,0.1)";
              const headerBorderColor = isGray
                ? "rgba(107,114,128,0.25)"
                : isRed
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(94,240,138,0.2)";
              const headerText = isGray
                ? "#9ca3af"
                : isRed
                  ? "#f87171"
                  : "#5EF08A";
              const countBg = isGray
                ? "rgba(107,114,128,0.2)"
                : isRed
                  ? "rgba(239,68,68,0.18)"
                  : "rgba(94,240,138,0.2)";
              return (
                <div
                  key={col.key}
                  data-ocid={`leads.column.${col.key.toLowerCase()}`}
                  style={{
                    width: "260px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Column header */}
                  <div
                    style={{
                      background: headerBg,
                      border: `1px solid ${headerBorderColor}`,
                      borderBottom: "none",
                      borderRadius: "8px 8px 0 0",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        color: headerText,
                        fontWeight: 700,
                        fontSize: "13px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {col.label}
                    </span>
                    <span
                      style={{
                        background: countBg,
                        color: headerText,
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "10px",
                        padding: "2px 8px",
                        minWidth: "22px",
                        textAlign: "center",
                      }}
                    >
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Cards area */}
                  <div
                    style={{
                      background: "rgba(14,16,32,0.8)",
                      border: "1px solid #1C1F33",
                      borderTop: "none",
                      borderRadius: "0 0 8px 8px",
                      padding: "12px",
                      minHeight: "120px",
                      flex: 1,
                    }}
                  >
                    {colLeads.length === 0 ? (
                      <p
                        style={{
                          color: "#7A7D90",
                          fontSize: "13px",
                          fontStyle: "italic",
                          textAlign: "center",
                          marginTop: "16px",
                        }}
                      >
                        No leads
                      </p>
                    ) : (
                      colLeads.map((lead) => {
                        cardIndex += 1;
                        return (
                          <LeadCard
                            key={String(lead.id)}
                            lead={lead}
                            index={cardIndex}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                            onConvert={setConvertLead}
                            highlightedId={calendarHighlightedId}
                            onAssignMeeting={setAssignTarget}
                            onFetchRescheduleHistory={
                              handleFetchRescheduleHistory
                            }
                            serviceLabels={Object.fromEntries(
                              products.map((p) => [String(p.id), p.name]),
                            )}
                            onSendRescheduleLink={async (l) => {
                              if (!actor) return;
                              const result = await (
                                actor as backendInterface
                              ).sendRescheduleLink(l.id);
                              if (result?.success === true) {
                                setLeads((prev) =>
                                  prev.map((x) =>
                                    x.id === l.id
                                      ? {
                                          ...x,
                                          rescheduleLinkSentAt:
                                            BigInt(Date.now()) * 1_000_000n,
                                        }
                                      : x,
                                  ),
                                );
                              } else {
                                throw new Error(
                                  result?.message ||
                                    "Backend returned a non-success response",
                                );
                              }
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Convert to Client Modal ── */}
      {convertLead && (
        <ConvertToClientModal
          prefillName={convertPrefillName}
          prefillEmail={convertPrefillEmail}
          prefillService={convertPrefillService}
          source="Lead"
          onClose={() => setConvertLead(null)}
          onSave={handleConvertSave}
        />
      )}

      {/* ── Lead Calendar ── */}
      {!loading && !error && (
        <>
          <FilterChipsRow
            isAllActive={isAllActive}
            activeFilters={activeFilters}
            calendarLeadsCount={calendarLeads.length}
            ALL_STATUS_FILTERS={ALL_STATUS_FILTERS}
            FILTER_CHIP_COLORS={FILTER_CHIP_COLORS}
            selectAll={selectAll}
            toggleFilter={toggleFilter}
          />
          <LeadCalendar
            leads={calendarLeads}
            draftCount={draftLeads.length}
            onHighlightLead={(id) => {
              setCalendarHighlightedId(id);
              setTimeout(() => setCalendarHighlightedId(null), 2000);
            }}
          />
        </>
      )}

      {/* ── Manual Book Modal ── */}
      {manualBookOpen && (
        <ManualBookModal
          availability={availability}
          serviceOptions={products.map((p) => p.name)}
          onClose={() => setManualBookOpen(false)}
          onDraftSave={async (data) => {
            const id = await handleManualBookDraft(data);
            if (id !== null) {
              setManualBookOpen(false);
              showToast(
                "Lead saved as draft. You can assign a meeting time later.",
              );
            } else {
              showToast("Failed to save lead — please try again.", "error");
            }
          }}
          onScheduleSave={async (data, date, time, method) => {
            const id = await handleManualBookDraft(data);
            if (id === null) {
              showToast("Failed to save lead — please try again.", "error");
              return;
            }
            const ok = await handleAssignMeeting(id, date, time, method);
            if (ok) {
              setManualBookOpen(false);
              showToast("Lead booked and calendar event created.");
            } else {
              showToast(
                "Lead saved, but failed to book meeting. Assign time from the card.",
                "error",
              );
            }
          }}
        />
      )}

      {/* ── Assign Meeting Modal (for draft lead cards) ── */}
      {assignTarget && (
        <AssignMeetingModal
          lead={assignTarget}
          availability={availability}
          onClose={() => setAssignTarget(null)}
          onAssign={async (date, time, method) => {
            const ok = await handleAssignMeeting(
              assignTarget.id,
              date,
              time,
              method,
            );
            if (ok) {
              setAssignTarget(null);
              showToast("Meeting assigned! Calendar event created.");
            } else {
              showToast(
                "Failed to assign meeting — please try again.",
                "error",
              );
            }
          }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #7A7D90; }
      `}</style>
    </AdminLayout>
  );
}

// ── Manual Book Modal ────────────────────────────────────────────────────────

interface ManualBookModalProps {
  serviceOptions: string[];
  availability: AvailabilitySettings;
  onClose: () => void;
  onDraftSave: (data: {
    name: string;
    email: string;
    phone: string;
    service: string;
    notes: string;
  }) => Promise<void>;
  onScheduleSave: (
    data: {
      name: string;
      email: string;
      phone: string;
      service: string;
      notes: string;
    },
    date: string,
    time: string,
    method: "phone" | "google_meet",
  ) => Promise<void>;
}

function ManualBookModal({
  serviceOptions,
  availability,
  onClose,
  onDraftSave,
  onScheduleSave,
}: ManualBookModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Free Consultation");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"form" | "schedule">("form");
  const [pendingDraftData, setPendingDraftData] = useState<{
    name: string;
    email: string;
    phone: string;
    service: string;
    notes: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inputStyle: CSSProperties = {
    width: "100%",
    background: "rgba(14,16,32,0.9)",
    border: "1px solid #1C1F33",
    borderRadius: "6px",
    padding: "9px 12px",
    fontSize: "14px",
    color: "#EEF0F8",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "#7A7D90",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
  };

  const isFormValid = name.trim() && email.trim();

  async function handleDraftSave() {
    if (!isFormValid) return;
    setSaving(true);
    await onDraftSave({ name, email, phone, service, notes });
    setSaving(false);
  }

  function handleScheduleNow() {
    if (!isFormValid) return;
    setPendingDraftData({ name, email, phone, service, notes });
    setMode("schedule");
  }

  return (
    <div
      data-ocid="leads.manual_book.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      aria-modal="true"
    >
      <div
        style={{ position: "absolute", inset: 0 }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter") onClose();
        }}
        aria-hidden="true"
      />
      <div
        style={{
          background: "rgba(17,19,34,0.99)",
          border: "1px solid #1C1F33",
          borderRadius: "12px",
          maxWidth: mode === "schedule" ? "600px" : "480px",
          width: "100%",
          padding: "32px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <h2
              style={{
                color: "#EEF0F8",
                fontSize: "18px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              {mode === "form" ? "Log New Lead" : "Schedule Meeting"}
            </h2>
            {mode === "schedule" && (
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "12px",
                  margin: "4px 0 0 0",
                }}
              >
                For:{" "}
                <span style={{ color: "#39FF14" }}>
                  {pendingDraftData?.name}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A7D90",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "6px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {mode === "form" && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div>
                <label htmlFor="mb-name" style={labelStyle}>
                  Name <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  id="mb-name"
                  data-ocid="leads.manual_book.name_input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label htmlFor="mb-email" style={labelStyle}>
                  Email <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  id="mb-email"
                  data-ocid="leads.manual_book.email_input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <label htmlFor="mb-phone" style={labelStyle}>
                  Phone Number
                </label>
                <input
                  id="mb-phone"
                  data-ocid="leads.manual_book.phone_input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="mb-service" style={labelStyle}>
                  Service Interest
                </label>
                <select
                  id="mb-service"
                  data-ocid="leads.manual_book.service_select"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="mb-notes" style={labelStyle}>
                  Notes
                </label>
                <textarea
                  id="mb-notes"
                  data-ocid="leads.manual_book.notes_textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  placeholder="Any quick notes from the call…"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                data-ocid="leads.manual_book.save_draft_button"
                onClick={handleDraftSave}
                disabled={!isFormValid || saving}
                style={{
                  flex: 1,
                  background:
                    !isFormValid || saving
                      ? "rgba(94,240,138,0.3)"
                      : "rgba(94,240,138,0.12)",
                  border: "1px solid rgba(94,240,138,0.4)",
                  borderRadius: "7px",
                  padding: "11px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#5EF08A",
                  cursor: !isFormValid || saving ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {saving && (
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      border: "2px solid rgba(94,240,138,0.3)",
                      borderTop: "2px solid #5EF08A",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                )}
                {saving ? "Saving…" : "Save as Draft Lead"}
              </button>
              <button
                type="button"
                data-ocid="leads.manual_book.schedule_now_button"
                onClick={handleScheduleNow}
                disabled={!isFormValid}
                style={{
                  flex: 1,
                  background: isFormValid ? "#39FF14" : "rgba(57,255,20,0.15)",
                  border: "none",
                  borderRadius: "7px",
                  padding: "11px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: isFormValid ? "#061209" : "#39FF14",
                  cursor: isFormValid ? "pointer" : "not-allowed",
                  opacity: isFormValid ? 1 : 0.6,
                  transition: "all 0.15s",
                }}
              >
                Save + Schedule Now
              </button>
            </div>
          </>
        )}

        {mode === "schedule" && pendingDraftData && (
          <>
            <SlotPicker
              availability={availability}
              twoHourBuffer
              onSelect={async (date, time, method) => {
                setSaving(true);
                await onScheduleSave(pendingDraftData, date, time, method);
                setSaving(false);
              }}
            />
            {saving && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "16px",
                  color: "#7A7D90",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid #1C1F33",
                    borderTop: "2px solid #5EF08A",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Booking…
              </div>
            )}
            <button
              type="button"
              onClick={() => setMode("form")}
              style={{
                marginTop: "16px",
                background: "none",
                border: "none",
                color: "#7A7D90",
                fontSize: "12px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Back to lead info
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Assign Meeting Modal (for existing draft leads) ───────────────────────────

interface AssignMeetingModalProps {
  lead: Lead;
  availability: AvailabilitySettings;
  onClose: () => void;
  onAssign: (
    date: string,
    time: string,
    method: "phone" | "google_meet",
  ) => Promise<void>;
}

function AssignMeetingModal({
  lead,
  availability,
  onClose,
  onAssign,
}: AssignMeetingModalProps) {
  const [saving, setSaving] = useState(false);
  const details = parseLeadMessage(lead.message);
  const displayName = details.contact_name || lead.name || "—";
  const displayEmail = details.contact_email || lead.email || "—";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      data-ocid="leads.assign_meeting.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      aria-modal="true"
    >
      <div
        style={{ position: "absolute", inset: 0 }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter") onClose();
        }}
        aria-hidden="true"
      />
      <div
        style={{
          background: "rgba(17,19,34,0.99)",
          border: "1px solid #1C1F33",
          borderRadius: "12px",
          maxWidth: "560px",
          width: "100%",
          padding: "32px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <h2
            style={{
              color: "#EEF0F8",
              fontSize: "18px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Assign Meeting Time
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A7D90",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "6px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Lead summary */}
        <div
          style={{
            background: "rgba(17,19,34,0.8)",
            border: "1px solid #1C1F33",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              color: "#EEF0F8",
              fontSize: "14px",
              fontWeight: 600,
              margin: "0 0 2px 0",
            }}
          >
            {displayName}
          </p>
          <p style={{ color: "#7A7D90", fontSize: "12px", margin: 0 }}>
            {displayEmail}
          </p>
        </div>

        <SlotPicker
          availability={availability}
          twoHourBuffer
          onSelect={async (date, time, method) => {
            setSaving(true);
            await onAssign(date, time, method);
            setSaving(false);
          }}
        />

        {saving && (
          <div
            style={{
              textAlign: "center",
              marginTop: "16px",
              color: "#7A7D90",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid #1C1F33",
                borderTop: "2px solid #5EF08A",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
            Assigning meeting…
          </div>
        )}
      </div>
    </div>
  );
}
