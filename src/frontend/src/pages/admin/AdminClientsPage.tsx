import { useNavigate } from "@tanstack/react-router";
import { Mail, Monitor, Receipt, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import type { backendInterface } from "../../backend.d";
import type { CrmClient, EmailTemplate } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

// ── Types ────────────────────────────────────────────────────────────────────

// Extended CrmClient with milestone fields added in backend v337+
type CrmClientWithMilestone = CrmClient & {
  currentMilestone?: bigint | number | null;
  milestoneUpdatedAt?: bigint | number | null;
};

type ViewFilter = "all" | "active_members";

// ── Milestone definitions ─────────────────────────────────────────────────────

const MILESTONES: { value: number; label: string }[] = [
  { value: 1, label: "Deposit Paid" },
  { value: 2, label: "Brief Submitted" },
  { value: 3, label: "Phase 1: Design & Wireframing" },
  { value: 4, label: "Phase 2: Core Development" },
  { value: 5, label: "Phase 3: QA & Testing" },
  { value: 6, label: "Ready for Launch" },
];

// Milestone badge colors — 1-2 blue, 3 orange, 4 purple, 5 amber, 6 green
const MILESTONE_COLORS: Record<
  number,
  { bg: string; color: string; border: string }
> = {
  1: {
    bg: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.35)",
  },
  2: {
    bg: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.35)",
  },
  3: {
    bg: "rgba(249,115,22,0.15)",
    color: "#fb923c",
    border: "rgba(249,115,22,0.35)",
  },
  4: {
    bg: "rgba(139,92,246,0.15)",
    color: "#a78bfa",
    border: "rgba(139,92,246,0.35)",
  },
  5: {
    bg: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
    border: "rgba(245,158,11,0.35)",
  },
  6: {
    bg: "rgba(94,240,138,0.15)",
    color: "#5EF08A",
    border: "rgba(94,240,138,0.35)",
  },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const DARK_CARD: CSSProperties = {
  background: "rgba(30,41,59,0.92)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const INPUT_STYLE: CSSProperties = {
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: 6,
  padding: "9px 13px",
  fontSize: 14,
  color: "#EEF0F8",
  background: "rgba(15,23,42,0.95)",
  outline: "none",
  boxSizing: "border-box",
  height: 40,
  fontFamily: "'Inter', 'Geist', system-ui, sans-serif",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

// Maps backend source values to display labels and badge colors
const SOURCE_CONFIG: Record<string, { label: string; style: CSSProperties }> = {
  Customer: {
    label: "PURCHASE",
    style: {
      background: "rgba(245,158,11,0.15)",
      color: "#fbbf24",
      border: "1px solid rgba(245,158,11,0.35)",
    },
  },
  Brief: {
    label: "QUESTIONNAIRE",
    style: {
      background: "rgba(59,130,246,0.15)",
      color: "#60a5fa",
      border: "1px solid rgba(59,130,246,0.3)",
    },
  },
  Lead: {
    label: "LEAD",
    style: {
      background: "rgba(122,125,144,0.12)",
      color: "#9DA0B3",
      border: "1px solid rgba(122,125,144,0.25)",
    },
  },
};

function SourceBadge({ source }: { source: string }) {
  const config = SOURCE_CONFIG[source];
  const style = config?.style ?? {
    background: "rgba(122,125,144,0.12)",
    color: "#7A7D90",
    border: "1px solid rgba(122,125,144,0.2)",
  };
  const label = config?.label ?? (source || "Unknown");
  return (
    <span
      style={{
        ...style,
        borderRadius: 5,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function AccountBadge({ hasAccount }: { hasAccount: boolean }) {
  return (
    <span
      style={{
        background: hasAccount
          ? "rgba(94,240,138,0.12)"
          : "rgba(122,125,144,0.1)",
        color: hasAccount ? "#5EF08A" : "#7A7D90",
        border: `1px solid ${hasAccount ? "rgba(94,240,138,0.3)" : "rgba(122,125,144,0.2)"}`,
        borderRadius: 5,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {hasAccount ? "Active Member" : "Contact"}
    </span>
  );
}

// ── Milestone Dropdown ────────────────────────────────────────────────────────

function MilestoneDropdown({
  clientId,
  currentMilestone,
  index,
  onMilestoneChange,
}: {
  clientId: string;
  currentMilestone: number;
  index: number;
  onMilestoneChange: (id: string, milestone: number) => Promise<void>;
}) {
  const [milestone, setMilestone] = useState(currentMilestone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const colors = milestone > 0 ? MILESTONE_COLORS[milestone] : null;

  async function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const newMilestone = Number(e.target.value);
    if (newMilestone <= milestone) return; // only advancing allowed
    const prevMilestone = milestone;
    setMilestone(newMilestone);
    setSaving(true);
    setSaveError(null);
    try {
      await onMilestoneChange(clientId, newMilestone);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setMilestone(prevMilestone);
      const msg =
        err instanceof Error ? err.message : "Failed to update milestone";
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 3500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        position: "relative",
      }}
    >
      {/* Milestone number badge */}
      {milestone > 0 && colors && (
        <span
          style={{
            background: colors.bg,
            color: colors.color,
            border: `1px solid ${colors.border}`,
            borderRadius: 5,
            padding: "1px 7px",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {milestone}/6
        </span>
      )}
      <div style={{ position: "relative" }}>
        <select
          data-ocid={`clients.milestone.select.${index}`}
          value={milestone}
          onChange={handleChange}
          disabled={saving || milestone >= 6}
          aria-label={`Manage milestone for client row ${index}`}
          style={{
            ...INPUT_STYLE,
            height: 32,
            padding: "4px 8px",
            fontSize: 12,
            fontWeight: 700,
            color: colors?.color ?? "#7A7D90",
            background: "rgba(14,16,32,0.9)",
            border: `1px solid ${colors ? colors.border : "rgba(122,125,144,0.25)"}`,
            cursor: saving || milestone >= 6 ? "not-allowed" : "pointer",
            minWidth: 175,
            borderRadius: 6,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {/* Placeholder when no milestone set */}
          {milestone === 0 && (
            <option
              value={0}
              disabled
              style={{ color: "#7A7D90", background: "#0E1020" }}
            >
              — Set Milestone —
            </option>
          )}
          {MILESTONES.map((m) => (
            <option
              key={m.value}
              value={m.value}
              disabled={m.value <= milestone}
              style={{
                color: m.value <= milestone ? "#3A3D50" : "#EEF0F8",
                background: "#0E1020",
              }}
            >
              {m.value <= milestone ? `✓ ${m.label}` : m.label}
            </option>
          ))}
        </select>
        {saved && (
          <span
            style={{
              position: "absolute",
              bottom: -16,
              left: 0,
              fontSize: 10,
              color: "#5EF08A",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            ✓ Milestone updated
          </span>
        )}
        {saveError && (
          <span
            style={{
              position: "absolute",
              bottom: -16,
              left: 0,
              fontSize: 10,
              color: "#f87171",
              fontWeight: 600,
              whiteSpace: "nowrap",
              maxWidth: 180,
            }}
          >
            ✕ {saveError}
          </span>
        )}
        {milestone >= 6 && (
          <span
            style={{
              position: "absolute",
              bottom: -16,
              left: 0,
              fontSize: 10,
              color: "#5EF08A",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            🚀 Ready for Launch
          </span>
        )}
      </div>
      {saving && (
        <span style={{ color: "#7A7D90", fontSize: 11, flexShrink: 0 }}>…</span>
      )}
    </div>
  );
}

// ── Portal Preview Modal ──────────────────────────────────────────────────────

function PortalPreviewModal({
  client,
  onClose,
}: {
  client: CrmClientWithMilestone;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      data-ocid="clients.portal_preview.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "rgba(14,16,32,0.98)",
          border: "1px solid #1C1F33",
          borderRadius: 12,
          width: "100%",
          maxWidth: 896,
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          position: "relative",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #1C1F33",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <Monitor size={16} color="#5EF08A" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  color: "#7A7D90",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Read-Only Admin Preview
              </span>
              <span
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 15,
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Viewing portal for: {client.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            data-ocid="clients.portal_preview.close_button"
            onClick={onClose}
            aria-label="Close portal preview"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A7D90",
              padding: 4,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Blocked interaction overlay — admin can only VIEW */}
        <div
          ref={overlayRef}
          style={{ position: "relative", flex: 1, overflow: "auto" }}
        >
          {/* Transparent overlay that captures all pointer events */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              pointerEvents: "all",
              cursor: "not-allowed",
              userSelect: "none",
            }}
          />

          {/* Portal content (rendered but non-interactive) */}
          <div
            style={{
              padding: 28,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {/* No-account warning banner */}
            {!client.hasAccount && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  borderRadius: 7,
                  padding: "10px 14px",
                  marginBottom: 20,
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
                <span
                  style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600 }}
                >
                  This client has not yet created a portal account. Showing
                  preview only.
                </span>
              </div>
            )}

            {/* Client greeting */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(94,240,138,0.15)",
                  border: "1.5px solid rgba(94,240,138,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#5EF08A",
                  flexShrink: 0,
                }}
              >
                {(client.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <p
                  style={{
                    color: "#7A7D90",
                    fontSize: 12,
                    margin: "0 0 2px",
                  }}
                >
                  Welcome back
                </p>
                <p
                  style={{
                    color: "#EEF0F8",
                    fontWeight: 700,
                    fontSize: 18,
                    margin: 0,
                  }}
                >
                  {client.name}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {[
                { label: "Project Status", value: client.projectStatus || "—" },
                {
                  label: "Active Services",
                  value: client.activeServices?.length
                    ? String(client.activeServices.length)
                    : "0",
                },
                {
                  label: "Account",
                  value: client.hasAccount ? "Active Member" : "Contact",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(17,19,34,0.8)",
                    border: "1px solid #1C1F33",
                    borderRadius: 8,
                    padding: "14px 16px",
                  }}
                >
                  <p
                    style={{
                      color: "#7A7D90",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      margin: "0 0 6px",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      color: "#5EF08A",
                      fontWeight: 700,
                      fontSize: 16,
                      margin: 0,
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Purchase History placeholder */}
            <div
              style={{
                background: "rgba(17,19,34,0.8)",
                border: "1px solid #1C1F33",
                borderRadius: 8,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 14,
                  margin: "0 0 14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Purchase History
              </h3>
              {client.activeServices && client.activeServices.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {client.activeServices.map((svc) => (
                    <div
                      key={svc}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "rgba(94,240,138,0.04)",
                        border: "1px solid rgba(94,240,138,0.15)",
                        borderRadius: 6,
                      }}
                    >
                      <span
                        style={{
                          color: "#EEF0F8",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {svc}
                      </span>
                      <span
                        style={{
                          background: "rgba(94,240,138,0.15)",
                          color: "#5EF08A",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                        }}
                      >
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#7A7D90", fontSize: 13, margin: 0 }}>
                  No purchases recorded yet.
                </p>
              )}
            </div>

            {/* Manage Subscriptions placeholder */}
            <div
              style={{
                background: "rgba(17,19,34,0.8)",
                border: "1px solid #1C1F33",
                borderRadius: 8,
                padding: 20,
              }}
            >
              <h3
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 14,
                  margin: "0 0 14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Manage Subscriptions
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  { label: "Billing Portal", desc: "Update payment methods" },
                  { label: "Plan Details", desc: "View current plan & usage" },
                  { label: "Upgrade Plan", desc: "Explore available upgrades" },
                ].map(({ label, desc }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "rgba(17,19,34,0.6)",
                      border: "1px solid #1C1F33",
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#EEF0F8",
                          fontSize: 13,
                          fontWeight: 600,
                          margin: "0 0 2px",
                        }}
                      >
                        {label}
                      </p>
                      <p style={{ color: "#7A7D90", fontSize: 12, margin: 0 }}>
                        {desc}
                      </p>
                    </div>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "rgba(94,240,138,0.1)",
                        border: "1px solid rgba(94,240,138,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#5EF08A",
                        fontSize: 16,
                      }}
                    >
                      →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Resend Email Modal ────────────────────────────────────────────────────────

function ResendEmailModal({
  clientName,
  clientId,
  actor,
  onClose,
  onToast,
}: {
  clientName: string;
  clientId: string;
  actor: backendInterface;
  onClose: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    actor
      .getEmailTemplates()
      .then((tpls) => {
        setTemplates(tpls);
        if (tpls.length > 0) setSelectedKey(tpls[0].trigger_key);
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [actor]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSend() {
    if (!selectedKey) return;
    setSending(true);
    try {
      const ok = await actor.resendEmail(clientId, selectedKey);
      if (ok) {
        onToast("Email sent successfully", "success");
        onClose();
      } else {
        onToast("Failed to send email — check Email Logs", "error");
      }
    } catch {
      onToast("Failed to send email — check Email Logs", "error");
    } finally {
      setSending(false);
    }
  }

  function formatTemplateLabel(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div
      data-ocid="clients.resend_email.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "rgba(17,18,34,0.99)",
          border: "1px solid #1C1F33",
          borderRadius: 12,
          width: "100%",
          maxWidth: 460,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(94,240,138,0.12)",
                border: "1px solid rgba(94,240,138,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Mail size={15} color="#5EF08A" />
            </div>
            <div>
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Resend Email
              </p>
              <p
                style={{
                  color: "#EEF0F8",
                  fontWeight: 700,
                  fontSize: 15,
                  margin: 0,
                  maxWidth: 280,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A7D90",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Template select */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="template-select"
            style={{
              display: "block",
              color: "#7A7D90",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Select Template
          </label>
          {loading ? (
            <div
              style={{
                height: 40,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 6,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ) : templates.length === 0 ? (
            <p style={{ color: "#7A7D90", fontSize: 13 }}>
              No templates found.
            </p>
          ) : (
            <select
              id="template-select"
              data-ocid="clients.resend_email.template_select"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(19,21,36,1)",
                border: "1px solid #1C1F33",
                borderRadius: 6,
                padding: "10px 13px",
                fontSize: 14,
                color: "#EEF0F8",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {templates.map((t) => (
                <option
                  key={t.trigger_key}
                  value={t.trigger_key}
                  style={{ background: "#0E1020", color: "#EEF0F8" }}
                >
                  {formatTemplateLabel(t.trigger_key)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            data-ocid="clients.resend_email.cancel"
            onClick={onClose}
            disabled={sending}
            style={{
              flex: 1,
              border: "1px solid #1C1F33",
              background: "transparent",
              color: "#7A7D90",
              borderRadius: 6,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="clients.resend_email.send_button"
            onClick={handleSend}
            disabled={sending || loading || !selectedKey}
            style={{
              flex: 2,
              border: "none",
              background:
                sending || loading || !selectedKey
                  ? "rgba(94,240,138,0.25)"
                  : "rgba(94,240,138,0.9)",
              color: sending || loading || !selectedKey ? "#3A5A40" : "#061209",
              borderRadius: 6,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 700,
              cursor:
                sending || loading || !selectedKey ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            {sending ? (
              <>
                <svg
                  className="animate-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  role="img"
                  aria-label="Sending"
                >
                  <title>Sending</title>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <Mail size={14} />
                Send Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

function ToastContainer({
  toasts,
  onDismiss,
}: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 340,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === "success"
                ? "rgba(17,34,20,0.97)"
                : "rgba(34,17,17,0.97)",
            border: `1px solid ${t.type === "success" ? "rgba(94,240,138,0.4)" : "rgba(239,68,68,0.4)"}`,
            borderRadius: 8,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            animation: "slideIn 0.2s ease",
          }}
        >
          <span
            style={{
              color: t.type === "success" ? "#5EF08A" : "#f87171",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.type === "success" ? "✓" : "✕"} {t.message}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7A7D90",
              padding: 2,
              display: "flex",
            }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminClientsPage() {
  const { actor, isFetching } = useActor();
  const [clients, setClients] = useState<CrmClientWithMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [portalClient, setPortalClient] =
    useState<CrmClientWithMilestone | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resendClient, setResendClient] =
    useState<CrmClientWithMilestone | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  function showToast(message: string, type: "success" | "error") {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Poll unread message counts every 15 seconds
  useEffect(() => {
    if (!actor || isFetching) return;
    function fetchUnreadCounts() {
      if (document.visibilityState !== "visible") return;
      (actor as backendInterface)
        .getUnreadMessageCounts()
        .then((pairs) => {
          const map: Record<string, number> = {};
          for (const [email, count] of pairs) {
            map[email] = Number(count);
          }
          setUnreadCounts(map);
        })
        .catch(() => {
          /* silently ignore — badge just won't show */
        });
    }
    fetchUnreadCounts();
    const intervalId = setInterval(fetchUnreadCounts, 15_000);
    return () => clearInterval(intervalId);
  }, [actor, isFetching]);

  // Fetch all clients from backend on mount
  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    (actor as backendInterface)
      .getClients()
      .then((data) => setClients(data))
      .catch(() => setError("Failed to load clients. Please refresh."))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  async function handleMilestoneChange(clientId: string, newMilestone: number) {
    if (!actor) throw new Error("Actor not ready");
    const result = (await (actor as backendInterface).updateClientMilestone(
      clientId,
      BigInt(newMilestone),
    )) as { ok: null } | { err: string };

    if ("err" in result) {
      throw new Error(result.err);
    }

    // Optimistically update local state without full re-fetch
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, currentMilestone: BigInt(newMilestone) }
          : c,
      ),
    );
  }

  async function handleDeleteClient(clientId: string) {
    if (!actor) return;
    setDeleting(true);
    try {
      const result = await (actor as backendInterface).deleteClient(clientId);
      if ("ok" in result) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        setDeleteConfirmId(null);
        showToast("Client deleted successfully", "success");
      } else {
        const errMsg = "err" in result ? String(result.err) : "Unknown error";
        showToast(`Delete failed: ${errMsg}`, "error");
      }
    } catch {
      showToast("Failed to delete client. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  // Client-side filter + search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesView =
        viewFilter === "all" ||
        (viewFilter === "active_members" && c.hasAccount);
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);
      return matchesView && matchesSearch;
    });
  }, [clients, search, viewFilter]);

  const COLS = [
    "Name",
    "Email",
    "Phone",
    "Source",
    "Active Services",
    "Status / Milestone",
    "Account",
    "Actions",
  ];

  const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

  return (
    <AdminLayout pageTitle="Clients">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div
          style={{
            ...DARK_CARD,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7A7D90"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              data-ocid="clients.search_input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone…"
              style={{
                ...INPUT_STYLE,
                width: "100%",
                paddingLeft: 34,
              }}
            />
          </div>

          {/* View toggle */}
          <div
            style={{
              display: "flex",
              gap: 0,
              border: "1px solid #1C1F33",
              borderRadius: 7,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {(
              [
                { key: "all", label: "All Contacts" },
                { key: "active_members", label: "Active Members" },
              ] as { key: ViewFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                data-ocid={`clients.filter.${key}`}
                onClick={() => setViewFilter(key)}
                style={{
                  border: "none",
                  padding: "0 16px",
                  height: 40,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background:
                    viewFilter === key
                      ? "rgba(94,240,138,0.15)"
                      : "transparent",
                  color: viewFilter === key ? "#5EF08A" : "#7A7D90",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Count chip */}
          <span
            style={{
              background: "rgba(94,240,138,0.1)",
              border: "1px solid rgba(94,240,138,0.2)",
              color: "#5EF08A",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {filtered.length} {filtered.length === 1 ? "record" : "records"}
          </span>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div
            data-ocid="clients.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#f87171",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div
          data-ocid="clients.table"
          style={{
            ...DARK_CARD,
            padding: "0",
            overflowX: "auto",
            WebkitOverflowScrolling:
              "touch" as CSSProperties["WebkitOverflowScrolling"],
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1020,
            }}
          >
            <thead>
              <tr>
                {COLS.map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#5EF08A",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      borderBottom: "1px solid rgba(94,240,138,0.2)",
                      whiteSpace: "nowrap",
                      background: "rgba(7,8,16,0.95)",
                      fontFamily: "'Courier New', Courier, monospace",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                SKELETON_ROWS.map((k) => (
                  <tr key={k} style={{ borderBottom: "1px solid #1C1F33" }}>
                    {COLS.map((col) => (
                      <td key={col} style={{ padding: "14px 14px" }}>
                        <div
                          style={{
                            height: 13,
                            width: "70%",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 4,
                            animation: "pulse 1.5s ease-in-out infinite",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    data-ocid="clients.empty_state"
                    colSpan={COLS.length}
                    style={{ padding: "60px 20px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "rgba(94,240,138,0.08)",
                          border: "1px solid rgba(94,240,138,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Users size={22} color="#5EF08A" />
                      </div>
                      <p
                        style={{
                          color: "#EEF0F8",
                          fontWeight: 600,
                          fontSize: 15,
                          margin: 0,
                        }}
                      >
                        {search || viewFilter !== "all"
                          ? "No clients match your filter"
                          : "No clients yet"}
                      </p>
                      <p
                        style={{
                          color: "#7A7D90",
                          fontSize: 13,
                          margin: 0,
                          maxWidth: 300,
                        }}
                      >
                        {search || viewFilter !== "all"
                          ? "Try adjusting your search or switching to 'All Contacts'."
                          : "Client records will appear here as leads, briefs, and customers are captured."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((client, idx) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    index={idx}
                    unreadCount={unreadCounts[client.email] ?? 0}
                    onMilestoneChange={handleMilestoneChange}
                    onDeleteRequest={() => setDeleteConfirmId(client.id)}
                    onResendEmail={() => setResendClient(client)}
                    onViewPortal={() => {
                      setPortalClient(client);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Portal Preview Modal ──────────────────────────────────────────── */}
      {portalClient && (
        <PortalPreviewModal
          client={portalClient}
          onClose={() => setPortalClient(null)}
        />
      )}

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      {deleteConfirmId && (
        <div
          data-ocid="clients.delete_confirm.modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDeleteConfirmId(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(14,16,32,0.98)",
              border: "1px solid #1C1F33",
              borderRadius: 12,
              width: "100%",
              maxWidth: 420,
              padding: 28,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
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
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={16} color="#f87171" />
              </div>
              <div>
                <p
                  style={{
                    color: "#EEF0F8",
                    fontWeight: 700,
                    fontSize: 15,
                    margin: 0,
                  }}
                >
                  Delete Client
                </p>
                <p
                  style={{ color: "#7A7D90", fontSize: 13, margin: "2px 0 0" }}
                >
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p
              style={{
                color: "#9DA0B3",
                fontSize: 14,
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              Are you sure you want to delete this client record? All associated
              data will be permanently removed.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                data-ocid="clients.delete_confirm.cancel"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                style={{
                  border: "1px solid #1C1F33",
                  background: "transparent",
                  color: "#7A7D90",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="clients.delete_confirm.confirm"
                onClick={() => handleDeleteClient(deleteConfirmId)}
                disabled={deleting}
                style={{
                  border: "none",
                  background: deleting
                    ? "rgba(239,68,68,0.4)"
                    : "rgba(239,68,68,0.85)",
                  color: "#fff",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={13} />
                {deleting ? "Deleting…" : "Delete Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .clients-row:hover td {
          background: rgba(94,240,138,0.025) !important;
        }
        .clients-row td {
          transition: background 0.1s;
        }
      `}</style>

      {/* ── Resend Email Modal ────────────────────────────────────────────── */}
      {resendClient && actor && (
        <ResendEmailModal
          clientName={resendClient.name}
          clientId={resendClient.id}
          actor={actor as backendInterface}
          onClose={() => setResendClient(null)}
          onToast={showToast}
        />
      )}

      {/* ── Toast Notifications ───────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminLayout>
  );
}

// ── Client Row (extracted to avoid redeclaring inside map) ────────────────────

function ClientRow({
  client,
  index,
  unreadCount,
  onMilestoneChange,
  onDeleteRequest,
  onResendEmail,
  onViewPortal,
}: {
  client: CrmClientWithMilestone;
  index: number;
  unreadCount: number;
  onMilestoneChange: (id: string, milestone: number) => Promise<void>;
  onDeleteRequest: () => void;
  onResendEmail: () => void;
  onViewPortal: () => void;
}) {
  const navigate = useNavigate();
  const services =
    client.activeServices && client.activeServices.length > 0
      ? client.activeServices.join(", ")
      : null;

  // currentMilestone may be bigint (from backend) or number — normalise to number
  const milestoneNum =
    client.currentMilestone != null ? Number(client.currentMilestone) : 0;

  return (
    <tr
      className="clients-row"
      data-ocid={`clients.row.${index + 1}`}
      style={{ borderBottom: "1px solid #1C1F33" }}
    >
      {/* Name + date */}
      <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              color: "#EEF0F8",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {client.name || "—"}
          </span>
          {unreadCount > 0 && (
            <span
              data-ocid={`clients.unread_badge.${index + 1}`}
              title={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: "#ef4444",
                color: "#fff",
                fontSize: 10,
                fontWeight: 800,
                lineHeight: 1,
                padding: "0 5px",
                flexShrink: 0,
                letterSpacing: "0.01em",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <span
          style={{
            color: "#7A7D90",
            fontSize: 11,
            marginTop: 2,
            display: "block",
          }}
        >
          {formatDate(client.created_at)}
        </span>
      </td>

      {/* Email */}
      <td style={{ padding: "13px 14px" }}>
        <span style={{ color: "#7A7D90", fontSize: 13 }}>
          {client.email || "—"}
        </span>
      </td>

      {/* Phone */}
      <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
        <span style={{ color: "#7A7D90", fontSize: 13 }}>
          {client.phone || <span style={{ color: "#1C1F33" }}>—</span>}
        </span>
      </td>

      {/* Source badge */}
      <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
        <SourceBadge source={client.source} />
      </td>

      {/* Active Services */}
      <td style={{ padding: "13px 14px", maxWidth: 220 }}>
        {services ? (
          <span
            style={{
              color: "#EEF0F8",
              fontSize: 12,
              lineHeight: 1.5,
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={services}
          >
            {services}
          </span>
        ) : (
          <span style={{ color: "#3A3D50", fontSize: 12 }}>No services</span>
        )}
      </td>

      {/* Status / Milestone cell — shown for ALL client types */}
      <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
        <MilestoneDropdown
          clientId={client.id}
          currentMilestone={milestoneNum}
          index={index + 1}
          onMilestoneChange={onMilestoneChange}
        />
      </td>

      {/* Account badge */}
      <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
        <AccountBadge hasAccount={client.hasAccount} />
      </td>

      {/* Actions */}
      <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            data-ocid={`clients.view_portal.button.${index + 1}`}
            onClick={onViewPortal}
            aria-label={`View portal for ${client.name}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(94,240,138,0.1)",
              border: "1px solid rgba(94,240,138,0.25)",
              color: "#5EF08A",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(94,240,138,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(94,240,138,0.1)";
            }}
          >
            <Monitor size={13} />
            View Portal
          </button>
          <button
            type="button"
            data-ocid={`clients.resend_email.button.${index + 1}`}
            onClick={onResendEmail}
            aria-label={`Resend email to ${client.name}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#60a5fa",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59,130,246,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(59,130,246,0.08)";
            }}
          >
            <Mail size={13} />
            Resend
          </button>
          <button
            type="button"
            data-ocid={`clients.invoice.button.${index + 1}`}
            aria-label={`Send invoice to ${client.name}`}
            title="Send Invoice"
            onClick={() =>
              navigate({
                to: "/admin/clients/$clientId",
                params: { clientId: client.id },
              })
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(250,204,21,0.08)",
              border: "1px solid rgba(250,204,21,0.25)",
              color: "#fbbf24",
              borderRadius: 6,
              padding: "5px 9px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(250,204,21,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(250,204,21,0.08)";
            }}
          >
            <Receipt size={13} />
          </button>
          <button
            type="button"
            data-ocid={`clients.delete.button.${index + 1}`}
            onClick={onDeleteRequest}
            aria-label={`Delete client ${client.name}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              borderRadius: 6,
              padding: "5px 9px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
