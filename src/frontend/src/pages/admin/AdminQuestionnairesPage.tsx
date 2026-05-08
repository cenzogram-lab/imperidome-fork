import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Save,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  CrmClient,
  QuestionDefinition,
  Questionnaire,
} from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

interface QWithClient extends Questionnaire {
  clientName: string;
  businessName: string;
  clientEmail: string;
}

type FilterOption = "all" | "unreviewed" | "reviewed" | "not_submitted";
type PageTab = "submissions" | "question_editor";

// ── Questionnaire type groups ────────────────────────────────────────────────
const TIER_GROUPS = [
  {
    group: "Custom Build Sites",
    tiers: [
      "DIGITAL PRESENCE",
      "AUTHORITY SITE",
      "BOOKING PRO",
      "RESTAURANT PRO",
      "RESTAURANT EMPIRE",
      "DIGITAL STOREFRONT",
      "MEMBERSHIP ENGINE",
      "ENTERPRISE SCALE",
    ],
  },
  {
    group: "Speedy Sites",
    tiers: [
      "SPEEDY BASIC",
      "SPEEDY BOOKING",
      "SPEEDY PRODUCT STOREFRONT",
      "SPEEDY MENU STOREFRONT",
      "SPEEDY RECURRING STOREFRONT",
    ],
  },
  {
    group: "Ads & Services",
    tiers: ["CinematicAds", "ProductAds", "AIReceptionist"],
  },
];

const INPUT_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select (dropdown)" },
  { value: "checkbox", label: "Checkbox" },
];

const HOVER_STYLE_ID = "admin-questionnaires-hover";
if (
  typeof document !== "undefined" &&
  !document.getElementById(HOVER_STYLE_ID)
) {
  const styleEl = document.createElement("style");
  styleEl.id = HOVER_STYLE_ID;
  styleEl.textContent =
    ".aq-row:hover{background:rgba(94,240,138,0.03)!important}.aq-link:hover{text-decoration:underline!important;color:#5EF08A!important}";
  document.head.appendChild(styleEl);
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatReviewedAt(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function parseAnswers(raw: string): Array<{ label: string; value: string }> {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.map(
        (item: {
          question?: string;
          label?: string;
          answer?: string;
          value?: string;
        }) => ({
          label: item.question ?? item.label ?? String(item),
          value: item.answer ?? item.value ?? "",
        }),
      );
    return Object.entries(parsed).map(([k, v]) => ({
      label: k,
      value: String(v),
    }));
  } catch {
    if (!raw || raw === "{}" || raw === "[]") return [];
    return [{ label: "Response", value: raw }];
  }
}

function extractFieldFromAnswers(
  answers: Array<{ label: string; value: string }>,
  keywords: string[],
): string {
  const match = answers.find((a) =>
    keywords.some((kw) => a.label.toLowerCase().includes(kw)),
  );
  return match?.value ?? "";
}

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;

function isImageUrl(val: string): boolean {
  return IMAGE_EXTS.test(val.trim()) || val.trim().startsWith("data:image");
}

function isLinkUrl(val: string): boolean {
  const trimmed = val.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function renderSingleValue(val: string): React.ReactNode {
  const trimmed = val.trim();
  if (!trimmed) return <span style={{ color: "#7A7D90" }}>—</span>;

  if (isImageUrl(trimmed)) {
    return (
      <img
        src={trimmed}
        alt="Submitted file"
        style={{
          maxWidth: "100%",
          maxHeight: 256,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          objectFit: "contain",
          marginTop: 4,
          display: "block",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  if (isLinkUrl(trimmed)) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#60a5fa",
          textDecoration: "underline",
          wordBreak: "break-all",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = "#93c5fd";
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = "#93c5fd";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.color = "#60a5fa";
        }}
      >
        {trimmed}
      </a>
    );
  }

  return (
    <span
      style={{
        color: "#EEF0F8",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }}
    >
      {trimmed}
    </span>
  );
}

function renderAnswerValue(value: string): React.ReactNode {
  if (!value || !value.trim()) {
    return <span style={{ color: "#7A7D90" }}>—</span>;
  }

  const hasNewlines = value.includes("\n");
  const commaItems = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isCommaSeparated =
    !hasNewlines &&
    commaItems.length > 1 &&
    commaItems.every((item) => item.length < 300);

  if (hasNewlines) {
    const lines = value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {lines.map((line) => (
            <div key={line}>{renderSingleValue(line)}</div>
          ))}
        </div>
      );
    }
  }

  if (isCommaSeparated) {
    const anySpecial = commaItems.some(
      (item) => isImageUrl(item) || isLinkUrl(item),
    );
    if (anySpecial) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {commaItems.map((item) => (
            <div key={item}>{renderSingleValue(item)}</div>
          ))}
        </div>
      );
    }
  }

  return renderSingleValue(value);
}

function getStatus(
  q: Questionnaire,
): "unreviewed" | "reviewed" | "not_submitted" {
  if (!q.submitted) return "not_submitted";
  if (q.reviewed) return "reviewed";
  return "unreviewed";
}

function StatusBadge({
  status,
}: { status: "unreviewed" | "reviewed" | "not_submitted" }) {
  const config = {
    unreviewed: {
      bg: "rgba(250,204,21,0.15)",
      text: "#fbbf24",
      label: "UNREVIEWED",
    },
    reviewed: {
      bg: "rgba(94,240,138,0.15)",
      text: "#5EF08A",
      label: "REVIEWED",
    },
    not_submitted: {
      bg: "rgba(122,125,144,0.15)",
      text: "#7A7D90",
      label: "NOT SUBMITTED",
    },
  }[status];
  return (
    <span
      style={{
        background: config.bg,
        color: config.text,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        letterSpacing: "0.04em",
      }}
    >
      {config.label}
    </span>
  );
}

function TierBadge({ tierCode }: { tierCode: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    CinematicAds: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
    ProductAds: { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
    AIReceptionist: { bg: "rgba(56,189,248,0.15)", text: "#38bdf8" },
  };
  const colors = colorMap[tierCode] ?? {
    bg: "rgba(99,102,241,0.15)",
    text: "#a5b4fc",
  };
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        letterSpacing: "0.04em",
      }}
    >
      {tierCode || "Unknown"}
    </span>
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
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

  const inputStyle: React.CSSProperties = {
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

  const labelStyle: React.CSSProperties = {
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
      data-ocid="questionnaires.convert_to_client.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
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
            <X size={18} />
          </button>
        </div>
        <p style={{ color: "#7A7D90", fontSize: "13px", margin: "0 0 24px 0" }}>
          Source:{" "}
          <span style={{ color: "#5EF08A", fontWeight: 600 }}>{source}</span>
        </p>

        {successMsg && (
          <div
            data-ocid="questionnaires.convert_to_client.success_state"
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
            <CheckCircle size={18} color="#5EF08A" />
            <span
              style={{ color: "#5EF08A", fontWeight: 600, fontSize: "14px" }}
            >
              {successMsg}
            </span>
          </div>
        )}

        {errorMsg && (
          <div
            data-ocid="questionnaires.convert_to_client.error_state"
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
                <label htmlFor="ctcq-name" style={labelStyle}>
                  Name
                </label>
                <input
                  id="ctcq-name"
                  data-ocid="questionnaires.convert_to_client.name_input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="ctcq-email" style={labelStyle}>
                  Email
                </label>
                <input
                  id="ctcq-email"
                  data-ocid="questionnaires.convert_to_client.email_input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="ctcq-phone" style={labelStyle}>
                  Phone
                </label>
                <input
                  id="ctcq-phone"
                  data-ocid="questionnaires.convert_to_client.phone_input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="ctcq-services" style={labelStyle}>
                  Active Services
                </label>
                <input
                  id="ctcq-services"
                  data-ocid="questionnaires.convert_to_client.services_input"
                  type="text"
                  value={activeServices}
                  onChange={(e) => setActiveServices(e.target.value)}
                  placeholder="e.g. Cinematic Ads"
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
                data-ocid="questionnaires.convert_to_client.save_button"
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

      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

// ── Detail Row helper ─────────────────────────────────────────────────────────

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 0",
        borderBottom: "1px solid rgba(28,31,51,0.8)",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#7A7D90",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

// ── Questionnaire Detail Modal ────────────────────────────────────────────────

interface ModalProps {
  q: QWithClient;
  onClose: () => void;
  onMarkReviewed: (id: bigint) => Promise<bigint | null>;
  onConvertToClient: (q: QWithClient) => void;
}

function QuestionnaireModal({
  q,
  onClose,
  onMarkReviewed,
  onConvertToClient,
}: ModalProps) {
  const [reviewed, setReviewed] = useState(q.reviewed);
  const [reviewedAt, setReviewedAt] = useState<bigint | undefined>(
    q.reviewed_at,
  );
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const markErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReviewed(q.reviewed);
    setReviewedAt(q.reviewed_at);
  }, [q.reviewed, q.reviewed_at]);

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

  async function handleMarkReviewed() {
    setMarking(true);
    const ts = await onMarkReviewed(q.id);
    if (ts !== null) {
      setReviewed(true);
      setReviewedAt(ts ?? BigInt(Date.now()) * BigInt(1_000_000));
    } else {
      setMarkError("Save Failed — please try again");
      if (markErrorTimerRef.current) clearTimeout(markErrorTimerRef.current);
      markErrorTimerRef.current = setTimeout(() => setMarkError(null), 5000);
    }
    setMarking(false);
  }

  const answers = parseAnswers(q.answers);

  const contactInfo: string =
    (q as unknown as Record<string, string>).contactInfo ??
    (q as unknown as Record<string, string>).contact_info ??
    answers.find(
      (a) =>
        a.label.toLowerCase().includes("contact") ||
        a.label.toLowerCase().includes("email") ||
        a.label.toLowerCase().includes("phone"),
    )?.value ??
    "";

  const submittedAtFormatted =
    q.submitted && q.submitted_at ? formatDate(q.submitted_at) : null;

  return (
    <div
      data-ocid="admin_questionnaires.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
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
        ref={panelRef}
        style={{
          background: "rgba(17,19,34,0.97)",
          border: "1px solid #1C1F33",
          borderRadius: 12,
          maxWidth: 760,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "32px 32px 40px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        <button
          type="button"
          data-ocid="admin_questionnaires.modal.close_button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "#7A7D90",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
          }}
        >
          <X size={20} />
        </button>

        <h2
          style={{
            color: "#EEF0F8",
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 24px 0",
            paddingRight: 32,
          }}
        >
          Submission Details
        </h2>

        <div
          style={{
            background: "rgba(19,21,36,0.6)",
            border: "1px solid #1C1F33",
            borderRadius: 8,
            padding: "0 16px",
            marginBottom: 24,
          }}
        >
          <DetailRow label="Name">
            <span style={{ color: "#EEF0F8", fontWeight: 600 }}>
              {q.clientName || "—"}
            </span>
          </DetailRow>

          <DetailRow label="Contact Info">
            {contactInfo ? (
              renderAnswerValue(contactInfo)
            ) : (
              <span style={{ color: "#7A7D90" }}>—</span>
            )}
          </DetailRow>

          <DetailRow label="Questionnaire Type">
            <TierBadge tierCode={q.tier_code || "Unknown"} />
          </DetailRow>

          {submittedAtFormatted && (
            <DetailRow label="Submitted At">
              <span style={{ color: "#EEF0F8" }}>{submittedAtFormatted}</span>
            </DetailRow>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <button
            type="button"
            data-ocid="admin_questionnaires.modal.convert_to_client_button"
            onClick={() => onConvertToClient(q)}
            style={{
              background: "rgba(94,240,138,0.1)",
              border: "1px solid rgba(94,240,138,0.35)",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              color: "#5EF08A",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
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
            <UserPlus size={14} />
            Convert to Client
          </button>
        </div>

        {!q.submitted && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ color: "#7A7D90", fontSize: 15, marginBottom: 20 }}>
              This client has not yet submitted their questionnaire.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#5EF08A",
                color: "#061209",
                border: "none",
                borderRadius: 6,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        )}

        {q.submitted && (
          <div>
            {!reviewed ? (
              <div
                style={{
                  background: "rgba(250,204,21,0.08)",
                  border: "1px solid rgba(250,204,21,0.25)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 24,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={16} color="#fbbf24" />
                  <span
                    style={{ color: "#fbbf24", fontSize: 14, fontWeight: 600 }}
                  >
                    This questionnaire has not been reviewed yet.
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid="admin_questionnaires.modal.mark_reviewed_button"
                  onClick={handleMarkReviewed}
                  disabled={marking}
                  style={{
                    background: "#5EF08A",
                    color: "#061209",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: marking ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {marking ? "Saving..." : "Mark as Reviewed"}
                </button>
                {markError && (
                  <span
                    data-ocid="admin_questionnaires.modal.save_error_state"
                    style={{
                      color: "#f87171",
                      fontSize: 13,
                      fontWeight: 500,
                      marginLeft: 12,
                    }}
                  >
                    {markError}
                  </span>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(94,240,138,0.08)",
                  border: "1px solid rgba(94,240,138,0.2)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 24,
                  flexWrap: "wrap",
                }}
              >
                <CheckCircle size={16} color="#5EF08A" />
                <span
                  style={{ color: "#5EF08A", fontSize: 14, fontWeight: 600 }}
                >
                  Questionnaire reviewed.
                </span>
                {reviewedAt !== undefined && reviewedAt !== null && (
                  <span style={{ color: "#7A7D90", fontSize: 13 }}>
                    Reviewed at {formatReviewedAt(reviewedAt)}
                  </span>
                )}
              </div>
            )}

            <h3
              style={{
                color: "#7A7D90",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 16px 0",
              }}
            >
              Answers
            </h3>

            {answers.length === 0 ? (
              <p
                data-ocid="admin_questionnaires.modal.empty_answers"
                style={{ color: "#7A7D90", fontSize: 14 }}
              >
                No answers submitted yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {answers.map((a, i) => (
                  <div
                    key={`${a.label}-${i}`}
                    style={{
                      padding: "14px 0",
                      borderBottom:
                        i < answers.length - 1
                          ? "1px solid rgba(28,31,51,0.8)"
                          : "none",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7A7D90",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        margin: "0 0 6px 0",
                      }}
                    >
                      {a.label}
                    </p>
                    <div style={{ fontSize: 14, lineHeight: 1.65 }}>
                      {renderAnswerValue(a.value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Question Editor ──────────────────────────────────────────────────────────

interface EditableQuestion {
  id: string;
  questionLabel: string;
  placeholder: string;
  description: string;
  inputType: string;
  options: string; // comma-separated string for editing
  required: boolean;
  sortOrder: number;
  confirmDelete: boolean;
}

function toEditable(q: QuestionDefinition): EditableQuestion {
  return {
    id: q.id,
    questionLabel: q.questionLabel,
    placeholder: q.placeholder,
    description: q.description,
    inputType: q.inputType,
    options: q.options.join(", "),
    required: q.required,
    sortOrder: Number(q.sortOrder),
    confirmDelete: false,
  };
}

function fromEditable(
  q: EditableQuestion,
  tierCode: string,
): QuestionDefinition {
  return {
    id: q.id,
    tierCode,
    questionLabel: q.questionLabel,
    placeholder: q.placeholder,
    description: q.description,
    inputType: q.inputType,
    options: q.options
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    required: q.required,
    sortOrder: BigInt(q.sortOrder),
  };
}

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const QE_INPUT: React.CSSProperties = {
  width: "100%",
  background: "rgba(14,16,32,0.9)",
  border: "1px solid #1C1F33",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  color: "#EEF0F8",
  outline: "none",
  boxSizing: "border-box",
};

const QE_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#7A7D90",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
  display: "block",
};

interface QuestionEditorProps {
  actor: import("../../backend.d").backendInterface;
}

function QuestionEditor({ actor }: QuestionEditorProps) {
  const [selectedTier, setSelectedTier] = useState("");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<EditableQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = JSON.stringify(questions) !== JSON.stringify(savedQuestions);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }

  async function loadQuestions(tierCode: string) {
    if (!tierCode) return;
    setLoading(true);
    try {
      const defs = await (
        actor as import("../../backend.d").backendInterface
      ).getQuestionDefinitions(tierCode);
      const editable = defs
        .slice()
        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
        .map(toEditable);
      setQuestions(editable);
      setSavedQuestions(editable);
    } catch (err) {
      showToast(
        `Failed to load questions: ${err instanceof Error ? err.message : String(err)}`,
        false,
      );
      setQuestions([]);
      setSavedQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleTierChange(tier: string) {
    setSelectedTier(tier);
    setQuestions([]);
    setSavedQuestions([]);
    if (tier) loadQuestions(tier);
  }

  function updateQuestion(idx: number, patch: Partial<EditableQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((q, i) => ({ ...q, sortOrder: i + 1 }));
    });
  }

  function moveDown(idx: number) {
    setQuestions((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((q, i) => ({ ...q, sortOrder: i + 1 }));
    });
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        questionLabel: "",
        placeholder: "",
        description: "",
        inputType: "text",
        options: "",
        required: false,
        sortOrder: prev.length + 1,
        confirmDelete: false,
      },
    ]);
  }

  function promptDelete(idx: number) {
    updateQuestion(idx, { confirmDelete: true });
  }

  function cancelDelete(idx: number) {
    updateQuestion(idx, { confirmDelete: false });
  }

  function confirmDeleteQuestion(idx: number) {
    setQuestions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, sortOrder: i + 1 })),
    );
  }

  function handleCancel() {
    setQuestions(savedQuestions.map((q) => ({ ...q, confirmDelete: false })));
  }

  async function handleSave() {
    if (!selectedTier) return;
    setSaving(true);
    try {
      const adminEmail = getAdminEmail();
      const defs = questions.map((q) => fromEditable(q, selectedTier));
      const result = await (
        actor as import("../../backend.d").backendInterface
      ).updateQuestionDefinitions(adminEmail, selectedTier, defs);
      if ("err" in result) {
        showToast(`Save failed: ${result.err}`, false);
      } else {
        const saved = questions.map((q) => ({ ...q, confirmDelete: false }));
        setSavedQuestions(saved);
        setQuestions(saved);
        showToast("Questions saved successfully.", true);
      }
    } catch (err) {
      showToast(
        `Save failed: ${err instanceof Error ? err.message : String(err)}`,
        false,
      );
    } finally {
      setSaving(false);
    }
  }

  const hasOptionsField = (inputType: string) =>
    inputType === "select" || inputType === "checkbox";

  return (
    <div>
      {/* Tier selector */}
      <div
        style={{
          background: "rgba(17,19,34,0.7)",
          border: "1px solid #1C1F33",
          borderRadius: 8,
          padding: 20,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <label
            htmlFor="qe-tier-select"
            style={{ ...QE_LABEL, marginBottom: 6 }}
          >
            Questionnaire Type
          </label>
          <select
            id="qe-tier-select"
            data-ocid="question_editor.tier_select"
            value={selectedTier}
            onChange={(e) => handleTierChange(e.target.value)}
            style={{
              ...QE_INPUT,
              appearance: "none",
              cursor: "pointer",
              padding: "9px 12px",
            }}
          >
            <option value="">— Select a questionnaire type —</option>
            {TIER_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.tiers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Save / Cancel — shown only when tier is selected */}
        {selectedTier && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              marginTop: 20,
            }}
          >
            {isDirty && (
              <span
                data-ocid="question_editor.unsaved_indicator"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fbbf24",
                  whiteSpace: "nowrap",
                }}
              >
                ● Unsaved changes
              </span>
            )}
            <button
              type="button"
              data-ocid="question_editor.cancel_button"
              onClick={handleCancel}
              disabled={saving || !isDirty}
              style={{
                background: "rgba(28,31,51,0.8)",
                border: "1px solid #1C1F33",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: isDirty ? "#EEF0F8" : "#7A7D90",
                cursor: saving || !isDirty ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              data-ocid="question_editor.save_button"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? "rgba(94,240,138,0.5)" : "#5EF08A",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                color: "#061209",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
            >
              {saving ? (
                <span
                  style={{
                    width: 12,
                    height: 12,
                    border: "2px solid rgba(6,18,9,0.3)",
                    borderTop: "2px solid #061209",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <Save size={13} />
              )}
              {saving ? "Saving…" : "Save All"}
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          data-ocid={
            toast.ok
              ? "question_editor.success_state"
              : "question_editor.error_state"
          }
          style={{
            background: toast.ok
              ? "rgba(94,240,138,0.12)"
              : "rgba(239,68,68,0.1)",
            border: `1px solid ${toast.ok ? "rgba(94,240,138,0.35)" : "rgba(239,68,68,0.35)"}`,
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
            color: toast.ok ? "#5EF08A" : "#f87171",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {toast.ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          data-ocid="question_editor.loading_state"
          style={{
            color: "#7A7D90",
            textAlign: "center",
            padding: "40px 0",
            fontSize: 14,
          }}
        >
          Loading questions…
        </div>
      )}

      {/* No tier selected */}
      {!selectedTier && !loading && (
        <div
          style={{
            background: "rgba(17,19,34,0.7)",
            border: "1px solid #1C1F33",
            borderRadius: 8,
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#7A7D90", fontSize: 14, margin: 0 }}>
            Select a questionnaire type above to view and edit its questions.
          </p>
        </div>
      )}

      {/* Empty state */}
      {selectedTier && !loading && questions.length === 0 && (
        <div
          data-ocid="question_editor.empty_state"
          style={{
            background: "rgba(17,19,34,0.7)",
            border: "1px solid #1C1F33",
            borderRadius: 8,
            padding: "32px 24px",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              color: "#7A7D90",
              fontSize: 14,
              margin: "0 0 8px 0",
              fontWeight: 600,
            }}
          >
            No custom questions configured for this type. Using default
            questions.
          </p>
          <p style={{ color: "#5A5D70", fontSize: 13, margin: 0 }}>
            Add questions below — saving will override the defaults for this
            questionnaire type.
          </p>
        </div>
      )}

      {/* Question cards */}
      {selectedTier && !loading && questions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {questions.map((q, idx) => (
            <div
              key={q.id}
              data-ocid={`question_editor.question_card.${idx + 1}`}
              style={{
                background: "rgba(17,19,34,0.7)",
                border: "1px solid #1C1F33",
                borderRadius: 8,
                padding: 18,
              }}
            >
              {/* Card header: order badge + reorder + delete */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(94,240,138,0.12)",
                      border: "1px solid rgba(94,240,138,0.3)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#5EF08A",
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: q.questionLabel ? "#EEF0F8" : "#5A5D70",
                    }}
                  >
                    {q.questionLabel || "New Question"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Reorder buttons */}
                  <button
                    type="button"
                    data-ocid={`question_editor.move_up_button.${idx + 1}`}
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    style={{
                      background: "rgba(28,31,51,0.8)",
                      border: "1px solid #1C1F33",
                      borderRadius: 5,
                      padding: "4px 7px",
                      cursor: idx === 0 ? "not-allowed" : "pointer",
                      color: idx === 0 ? "#3A3D50" : "#7A7D90",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    data-ocid={`question_editor.move_down_button.${idx + 1}`}
                    onClick={() => moveDown(idx)}
                    disabled={idx === questions.length - 1}
                    aria-label="Move down"
                    style={{
                      background: "rgba(28,31,51,0.8)",
                      border: "1px solid #1C1F33",
                      borderRadius: 5,
                      padding: "4px 7px",
                      cursor:
                        idx === questions.length - 1
                          ? "not-allowed"
                          : "pointer",
                      color:
                        idx === questions.length - 1 ? "#3A3D50" : "#7A7D90",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>

                  {/* Delete with inline confirmation */}
                  {!q.confirmDelete ? (
                    <button
                      type="button"
                      data-ocid={`question_editor.delete_button.${idx + 1}`}
                      onClick={() => promptDelete(idx)}
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 5,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#f87171",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: 6,
                        padding: "4px 10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#f87171",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Confirm delete?
                      </span>
                      <button
                        type="button"
                        data-ocid={`question_editor.delete_cancel_button.${idx + 1}`}
                        onClick={() => cancelDelete(idx)}
                        style={{
                          background: "rgba(28,31,51,0.8)",
                          border: "1px solid #1C1F33",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#7A7D90",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        data-ocid={`question_editor.delete_confirm_button.${idx + 1}`}
                        onClick={() => confirmDeleteQuestion(idx)}
                        style={{
                          background: "rgba(239,68,68,0.2)",
                          border: "1px solid rgba(239,68,68,0.5)",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#f87171",
                          cursor: "pointer",
                        }}
                      >
                        Yes
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fields grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {/* Question Label */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor={`qe-label-${q.id}`} style={QE_LABEL}>
                    Question Label *
                  </label>
                  <input
                    id={`qe-label-${q.id}`}
                    data-ocid={`question_editor.label_input.${idx + 1}`}
                    type="text"
                    value={q.questionLabel}
                    onChange={(e) =>
                      updateQuestion(idx, { questionLabel: e.target.value })
                    }
                    placeholder="e.g. What is your business name?"
                    style={QE_INPUT}
                  />
                </div>

                {/* Placeholder */}
                <div>
                  <label htmlFor={`qe-placeholder-${q.id}`} style={QE_LABEL}>
                    Placeholder
                  </label>
                  <input
                    id={`qe-placeholder-${q.id}`}
                    data-ocid={`question_editor.placeholder_input.${idx + 1}`}
                    type="text"
                    value={q.placeholder}
                    onChange={(e) =>
                      updateQuestion(idx, { placeholder: e.target.value })
                    }
                    placeholder="e.g. Enter your business name…"
                    style={QE_INPUT}
                  />
                </div>

                {/* Input Type */}
                <div>
                  <label htmlFor={`qe-type-${q.id}`} style={QE_LABEL}>
                    Input Type
                  </label>
                  <select
                    id={`qe-type-${q.id}`}
                    data-ocid={`question_editor.type_select.${idx + 1}`}
                    value={q.inputType}
                    onChange={(e) =>
                      updateQuestion(idx, { inputType: e.target.value })
                    }
                    style={{
                      ...QE_INPUT,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    {INPUT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Required toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingTop: 20,
                  }}
                >
                  <input
                    id={`qe-required-${q.id}`}
                    data-ocid={`question_editor.required_checkbox.${idx + 1}`}
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) =>
                      updateQuestion(idx, { required: e.target.checked })
                    }
                    style={{
                      width: 16,
                      height: 16,
                      cursor: "pointer",
                      accentColor: "#5EF08A",
                    }}
                  />
                  <label
                    htmlFor={`qe-required-${q.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#EEF0F8",
                      cursor: "pointer",
                    }}
                  >
                    Required
                  </label>
                </div>

                {/* Options — only for select/checkbox types */}
                {hasOptionsField(q.inputType) && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor={`qe-options-${q.id}`} style={QE_LABEL}>
                      Options (comma-separated)
                    </label>
                    <input
                      id={`qe-options-${q.id}`}
                      data-ocid={`question_editor.options_input.${idx + 1}`}
                      type="text"
                      value={q.options}
                      onChange={(e) =>
                        updateQuestion(idx, { options: e.target.value })
                      }
                      placeholder="e.g. Option A, Option B, Option C"
                      style={QE_INPUT}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Question button */}
      {selectedTier && !loading && (
        <button
          type="button"
          data-ocid="question_editor.add_question_button"
          onClick={addQuestion}
          style={{
            width: "100%",
            background: "rgba(94,240,138,0.07)",
            border: "1px dashed rgba(94,240,138,0.35)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: 700,
            color: "#5EF08A",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.15s",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(94,240,138,0.12)";
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(94,240,138,0.12)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(94,240,138,0.07)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(94,240,138,0.07)";
          }}
        >
          <Plus size={15} />
          Add Question
        </button>
      )}

      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminQuestionnairesPage() {
  const { actor, isFetching } = useActor();
  const [pageTab, setPageTab] = useState<PageTab>("submissions");
  const [questionnaires, setQuestionnaires] = useState<QWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [selectedQ, setSelectedQ] = useState<QWithClient | null>(null);
  const [convertQ, setConvertQ] = useState<QWithClient | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);

    const adminEmail = getAdminEmail();
    (async () => {
      try {
        const [qs, clients] = await Promise.all([
          (
            actor as import("@/backend").backendInterface
          ).getAdminAllQuestionnaires(adminEmail),
          (actor as import("../../backend.d").backendInterface)
            .getClients(adminEmail)
            .catch(() => [] as CrmClient[]),
        ]);

        const emailToClient = new Map<string, CrmClient>();
        for (const c of clients) {
          if (c.email) emailToClient.set(c.email.toLowerCase(), c);
        }

        const enriched: QWithClient[] = (qs ?? []).map((q) => {
          const parsedAnswers = parseAnswers(q.answers);
          const answerEmail =
            parsedAnswers
              .find(
                (a) =>
                  a.label.toLowerCase().includes("email") ||
                  a.label.toLowerCase().includes("contact"),
              )
              ?.value?.toLowerCase() ?? "";
          const client = answerEmail
            ? emailToClient.get(answerEmail)
            : undefined;
          const clientName = client?.name?.trim() || "Unknown Client";
          const businessName = "";
          const clientEmail = client?.email ?? answerEmail;
          return { ...q, clientName, businessName, clientEmail };
        });

        setQuestionnaires(enriched);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err ?? "");
        setError(
          msg.toLowerCase().includes("not authorized") ||
            msg.toLowerCase().includes("unauthorized")
            ? "You are not authorized to view questionnaires."
            : "Failed to load questionnaires.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [actor, isFetching]);

  const unreviewedCount = questionnaires.filter(
    (q) => q.submitted && !q.reviewed,
  ).length;

  const filtered = questionnaires.filter((q) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      q.clientName.toLowerCase().includes(searchLower) ||
      q.clientEmail.toLowerCase().includes(searchLower) ||
      (q.tier_code || "").toLowerCase().includes(searchLower);
    const status = getStatus(q);
    const matchesFilter =
      filter === "all" ||
      (filter === "unreviewed" && status === "unreviewed") ||
      (filter === "reviewed" && status === "reviewed") ||
      (filter === "not_submitted" && status === "not_submitted");
    return matchesSearch && matchesFilter;
  });

  const [markingRowId, setMarkingRowId] = useState<bigint | null>(null);
  const [markRowError, setMarkRowError] = useState<{
    id: bigint;
    msg: string;
  } | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<bigint | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);

  function promptDeleteQuestionnaire(id: bigint) {
    setDeleteConfirmId(id);
  }

  async function confirmDeleteQuestionnaire() {
    const id = deleteConfirmId;
    if (id === null || !actor) return;
    setDeleteConfirmId(null);
    setDeletingRowId(id);
    try {
      await (
        actor as import("../../backend.d").backendInterface
      ).deleteQuestionnaire(getAdminEmail(), id);
      setQuestionnaires((prev) => prev.filter((q) => q.id !== id));
      if (selectedQ?.id === id) setSelectedQ(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Delete failed — please try again";
      setMarkRowError({ id, msg });
      setTimeout(() => setMarkRowError(null), 5000);
    } finally {
      setDeletingRowId(null);
    }
  }

  async function handleMarkReviewed(id: bigint): Promise<bigint | null> {
    if (!actor) return null;
    const adminEmail = getAdminEmail();
    setMarkingRowId(id);
    try {
      await (
        actor as import("../../backend.d").backendInterface
      ).markQuestionnaireReviewed(adminEmail, id);
      const nowNs = BigInt(Date.now()) * BigInt(1_000_000);
      setQuestionnaires((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, reviewed: true, reviewed_at: nowNs } : q,
        ),
      );
      setSelectedQ((prev) =>
        prev && prev.id === id
          ? { ...prev, reviewed: true, reviewed_at: nowNs }
          : prev,
      );
      setMarkingRowId(null);
      return nowNs;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Save Failed — please try again";
      setMarkRowError({ id, msg });
      setTimeout(() => setMarkRowError(null), 5000);
      setMarkingRowId(null);
      return null;
    }
  }

  function buildConvertPrefill(q: QWithClient): {
    name: string;
    email: string;
    service: string;
  } {
    const answers = parseAnswers(q.answers);
    const name =
      q.clientName !== "Unknown Client"
        ? q.clientName
        : extractFieldFromAnswers(answers, ["name", "your name", "full name"]);
    const email = extractFieldFromAnswers(answers, [
      "email",
      "e-mail",
      "contact email",
    ]);
    const service = q.tier_code || "";
    return { name, email, service };
  }

  async function handleConvertSave(
    name: string,
    email: string,
    phone: string,
    activeServices: string,
  ): Promise<string | null> {
    if (!actor) return null;
    try {
      const clientId = await (
        actor as import("../../backend.d").backendInterface
      ).addClient(
        name,
        email,
        phone,
        "Brief",
        activeServices ? [activeServices] : [],
        null,
      );
      return typeof clientId === "string" ? clientId : String(clientId);
    } catch (err) {
      console.error("Failed to create client:", err);
      return null;
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid #1C1F33",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 14,
    color: "#EEF0F8",
    background: "rgba(19,21,36,1)",
    outline: "none",
  };

  // Sub-tab styles
  function tabStyle(active: boolean): React.CSSProperties {
    return {
      background: active ? "rgba(94,240,138,0.12)" : "transparent",
      border: active
        ? "1px solid rgba(94,240,138,0.35)"
        : "1px solid transparent",
      borderRadius: 7,
      padding: "7px 18px",
      fontSize: 13,
      fontWeight: 700,
      color: active ? "#5EF08A" : "#7A7D90",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.15s",
    };
  }

  return (
    <AdminLayout pageTitle="Questionnaires">
      {/* ── Sub-tab switcher ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          background: "rgba(17,19,34,0.7)",
          border: "1px solid #1C1F33",
          borderRadius: 10,
          padding: "8px 12px",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          data-ocid="admin_questionnaires.submissions_tab"
          onClick={() => setPageTab("submissions")}
          style={tabStyle(pageTab === "submissions")}
        >
          Submissions
          {unreviewedCount > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#EF4444",
                color: "#fff",
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                lineHeight: "16px",
                verticalAlign: "middle",
              }}
            >
              {unreviewedCount}
            </span>
          )}
        </button>
        <button
          type="button"
          data-ocid="admin_questionnaires.question_editor_tab"
          onClick={() => setPageTab("question_editor")}
          style={tabStyle(pageTab === "question_editor")}
        >
          Question Editor
        </button>
      </div>

      {/* ── Submissions tab ── */}
      {pageTab === "submissions" && (
        <>
          {/* Filter Bar */}
          <div
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid #1C1F33",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              data-ocid="admin_questionnaires.search_input"
              type="text"
              placeholder="Search by client name or business name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, flex: "1 1 220px", minWidth: 0 }}
            />
            <div style={{ position: "relative", flex: "0 0 auto" }}>
              <select
                data-ocid="admin_questionnaires.filter_select"
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterOption)}
                style={{
                  ...inputStyle,
                  padding: "8px 36px 8px 12px",
                  appearance: "none",
                  cursor: "pointer",
                  minWidth: 160,
                }}
              >
                <option value="all">All</option>
                <option value="unreviewed">
                  {unreviewedCount > 0
                    ? `Unreviewed (${unreviewedCount})`
                    : "Unreviewed"}
                </option>
                <option value="reviewed">Reviewed</option>
                <option value="not_submitted">Not Yet Submitted</option>
              </select>
              {unreviewedCount > 0 && filter !== "unreviewed" && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: 28,
                    background: "#EF4444",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    lineHeight: "16px",
                    pointerEvents: "none",
                  }}
                >
                  {unreviewedCount}
                </span>
              )}
            </div>
          </div>

          {/* Table card */}
          <div
            style={{
              background: "rgba(17,19,34,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid #1C1F33",
              borderRadius: 8,
              padding: 24,
            }}
          >
            {loading && (
              <div
                data-ocid="admin_questionnaires.loading_state"
                style={{
                  color: "#7A7D90",
                  textAlign: "center",
                  padding: "32px 0",
                  fontSize: 14,
                }}
              >
                Loading questionnaires…
              </div>
            )}
            {error && (
              <div
                data-ocid="admin_questionnaires.error_state"
                style={{
                  color: "#f87171",
                  textAlign: "center",
                  padding: "32px 0",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div
                data-ocid="admin_questionnaires.empty_state"
                style={{
                  color: "#7A7D90",
                  textAlign: "center",
                  padding: "32px 0",
                  fontSize: 14,
                }}
              >
                No questionnaires found.
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table
                  data-ocid="admin_questionnaires.table"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 700,
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
                      {[
                        "Client Name",
                        "Email",
                        "Tier / Service",
                        "Submitted Date",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#7A7D90",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q, idx) => {
                      const status = getStatus(q);
                      return (
                        <tr
                          key={String(q.id)}
                          data-ocid={`admin_questionnaires.row.${idx + 1}`}
                          className="aq-row"
                          style={{
                            borderBottom: "1px solid #1C1F33",
                            transition: "background 0.15s",
                          }}
                        >
                          <td style={{ padding: "12px 12px" }}>
                            <span
                              style={{
                                color: "#EEF0F8",
                                fontWeight: 700,
                              }}
                            >
                              {q.clientName}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              color: "#7A7D90",
                              fontSize: 13,
                            }}
                          >
                            {q.clientEmail || (
                              <span style={{ color: "#7A7D90" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 12px" }}>
                            <TierBadge tierCode={q.tier_code || "—"} />
                          </td>
                          <td
                            style={{
                              padding: "12px 12px",
                              color: "#7A7D90",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {q.submitted && q.submitted_at ? (
                              formatDate(q.submitted_at)
                            ) : (
                              <span style={{ color: "#7A7D90" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 12px" }}>
                            <StatusBadge status={status} />
                          </td>
                          <td style={{ padding: "12px 12px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                data-ocid={`admin_questionnaires.view_button.${idx + 1}`}
                                onClick={() => setSelectedQ(q)}
                                style={{
                                  background: "rgba(94,240,138,0.1)",
                                  border: "1px solid rgba(94,240,138,0.3)",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  color: "#5EF08A",
                                  padding: "5px 12px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  whiteSpace: "nowrap",
                                  transition: "background 0.15s",
                                }}
                              >
                                <Eye size={13} />
                                View Details
                              </button>
                              {status === "unreviewed" && (
                                <button
                                  type="button"
                                  data-ocid={`admin_questionnaires.mark_reviewed_button.${idx + 1}`}
                                  onClick={() => handleMarkReviewed(q.id)}
                                  disabled={markingRowId === q.id}
                                  style={{
                                    background: "#5EF08A",
                                    color: "#061209",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "5px 10px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {markingRowId === q.id
                                    ? "Saving..."
                                    : "Mark Reviewed"}
                                </button>
                              )}
                              <button
                                type="button"
                                data-ocid={`admin_questionnaires.delete_button.${idx + 1}`}
                                onClick={() => promptDeleteQuestionnaire(q.id)}
                                disabled={deletingRowId === q.id}
                                style={{
                                  background: "rgba(239,68,68,0.1)",
                                  border: "1px solid rgba(239,68,68,0.35)",
                                  borderRadius: 6,
                                  padding: "5px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#f87171",
                                  cursor:
                                    deletingRowId === q.id
                                      ? "not-allowed"
                                      : "pointer",
                                  whiteSpace: "nowrap",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  opacity: deletingRowId === q.id ? 0.6 : 1,
                                  transition: "background 0.15s",
                                }}
                                onMouseOver={(e) => {
                                  if (deletingRowId !== q.id)
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.background = "rgba(239,68,68,0.2)";
                                }}
                                onFocus={(e) => {
                                  if (deletingRowId !== q.id)
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.background = "rgba(239,68,68,0.2)";
                                }}
                                onMouseOut={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "rgba(239,68,68,0.1)";
                                }}
                                onBlur={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.background = "rgba(239,68,68,0.1)";
                                }}
                              >
                                <Trash2 size={12} />
                                {deletingRowId === q.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                              {markRowError?.id === q.id && (
                                <div
                                  data-ocid="admin_questionnaires.mark_reviewed.save_error_state"
                                  style={{
                                    color: "#f87171",
                                    fontSize: 11,
                                    marginTop: 4,
                                  }}
                                >
                                  {markRowError.msg}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Question Editor tab ── */}
      {pageTab === "question_editor" && actor && (
        <QuestionEditor
          actor={actor as import("../../backend.d").backendInterface}
        />
      )}
      {pageTab === "question_editor" && !actor && (
        <div
          style={{
            color: "#7A7D90",
            textAlign: "center",
            padding: "40px 0",
            fontSize: 14,
          }}
        >
          Connecting to backend…
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId !== null && (
        <div
          data-ocid="admin_questionnaires.delete_confirm.dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10002,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          aria-modal="true"
        >
          <div
            style={{ position: "absolute", inset: 0 }}
            onClick={() => setDeleteConfirmId(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setDeleteConfirmId(null);
            }}
            aria-hidden="true"
          />
          <div
            style={{
              background: "rgba(17,19,34,0.98)",
              border: "1px solid #1C1F33",
              borderRadius: "12px",
              maxWidth: "420px",
              width: "100%",
              padding: "32px",
              position: "relative",
              zIndex: 1,
              boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={16} color="#f87171" />
              </div>
              <h2
                style={{
                  color: "#EEF0F8",
                  fontSize: "16px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Delete Questionnaire
              </h2>
            </div>
            <p
              style={{
                color: "#7A7D90",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 0 24px 0",
              }}
            >
              Are you sure you want to delete this questionnaire? This cannot be
              undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                data-ocid="admin_questionnaires.delete_confirm.cancel_button"
                onClick={() => setDeleteConfirmId(null)}
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
                type="button"
                data-ocid="admin_questionnaires.delete_confirm.confirm_button"
                onClick={confirmDeleteQuestionnaire}
                style={{
                  flex: 1,
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.5)",
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#f87171",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedQ && (
        <QuestionnaireModal
          q={selectedQ}
          onClose={() => setSelectedQ(null)}
          onMarkReviewed={handleMarkReviewed}
          onConvertToClient={(q) => {
            setSelectedQ(null);
            setConvertQ(q);
          }}
        />
      )}

      {/* ── Convert to Client Modal ── */}
      {convertQ &&
        (() => {
          const prefill = buildConvertPrefill(convertQ);
          return (
            <ConvertToClientModal
              prefillName={prefill.name}
              prefillEmail={prefill.email}
              prefillService={prefill.service}
              source="Brief"
              onClose={() => setConvertQ(null)}
              onSave={handleConvertSave}
            />
          );
        })()}
    </AdminLayout>
  );
}
