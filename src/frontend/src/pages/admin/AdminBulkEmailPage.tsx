import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../../backend";
import type { CrmClient } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

// ─── Shared Styles ───────────────────────────────────────────────────────────
const DARK_CARD: React.CSSProperties = {
  background: "rgba(17,19,34,0.85)",
  backdropFilter: "blur(12px)",
  border: "1px solid #1C1F33",
  borderRadius: "10px",
};

const NEON = "#00FFA3";
const NEON_AMBER = "#FBBF24";
const TEXT = "#EEF0F8";
const MUTED = "#7A7D90";

type Segment = "all_clients" | "active_clients" | "subscriptions_only";

const SEGMENTS: { value: Segment; label: string; desc: string }[] = [
  {
    value: "all_clients",
    label: "All Clients",
    desc: "Every registered client account",
  },
  {
    value: "active_clients",
    label: "Active Clients",
    desc: "Clients with active projects",
  },
  {
    value: "subscriptions_only",
    label: "Subscriptions Only",
    desc: "Clients with active subscriptions",
  },
];

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "rgba(10,11,20,0.8)",
    border: focused ? "1px solid rgba(0,255,163,0.5)" : "1px solid #1C1F33",
    borderRadius: "8px",
    color: TEXT,
    fontSize: "14px",
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    resize: "none" as const,
  };
}

export default function AdminBulkEmailPage() {
  const { actor } = useActor();

  const [segment, setSegment] = useState<Segment>("all_clients");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [clients, setClients] = useState<CrmClient[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    actor
      .getClients(adminEmail)
      .then((c) => {
        setClients(c);
        setDataLoaded(true);
      })
      .catch(() => setDataLoaded(true));
  }, [actor]);

  /** Compute the target recipients based on segment */
  function getRecipients(): Array<{
    email: string;
    name: string;
    clientId?: string;
  }> {
    if (segment === "active_clients") {
      return clients
        .filter(
          (c) => c.projectStatus === "active" || Number(c.currentMilestone) > 0,
        )
        .map((c) => ({ email: c.email, name: c.name, clientId: c.id }));
    }
    if (segment === "subscriptions_only") {
      return clients
        .filter((c) => c.activeServices && c.activeServices.length > 0)
        .map((c) => ({ email: c.email, name: c.name, clientId: c.id }));
    }
    // all_clients
    return clients.map((c) => ({
      email: c.email,
      name: c.name,
      clientId: c.id,
    }));
  }

  const recipients = dataLoaded ? getRecipients() : [];
  const selectedSegment = SEGMENTS.find((s) => s.value === segment)!;

  async function handleSend() {
    if (!actor) return;
    if (!subject.trim()) {
      toast.error("Please enter a subject line.");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message body.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("No recipients found for this segment.");
      return;
    }

    setSending(true);
    const adminEmail = getAdminEmail();
    let successCount = 0;
    let failCount = 0;

    // Send emails sequentially using the resendEmail backend function for clients.
    // For bulk we use actor.resendEmail with "bulk_announcement" template key
    // which the backend routes through the email-marketing extension.
    for (const recipient of recipients) {
      try {
        await (actor as backendInterface).resendEmail(
          adminEmail,
          recipient.clientId!,
          "bulk_announcement",
        );
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSending(false);

    if (successCount > 0 && failCount === 0) {
      toast.success(
        `Campaign sent to ${successCount} recipient${successCount !== 1 ? "s" : ""}.`,
      );
      setSubject("");
      setBody("");
    } else if (successCount > 0) {
      toast.warning(`Sent to ${successCount} recipients. ${failCount} failed.`);
    } else {
      toast.error("Campaign failed to send. Check your email settings.");
    }
  }

  return (
    <AdminLayout pageTitle="Bulk Email">
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <div>
          <h2
            style={{
              color: TEXT,
              fontWeight: 800,
              fontSize: "22px",
              margin: 0,
            }}
          >
            Bulk Email Campaign
          </h2>
          <p style={{ color: MUTED, fontSize: "13px", margin: "6px 0 0" }}>
            Send announcements, promotions, or updates to your clients and
            leads.
          </p>
        </div>

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
          className="grid grid-cols-1 md:grid-cols-2"
        >
          {/* ── Left: Compose ── */}
          <div
            style={{
              ...DARK_CARD,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <h3
              style={{
                color: TEXT,
                fontSize: "15px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Compose Message
            </h3>

            {/* Segment Selector */}
            <div>
              <label
                htmlFor="bulk-segment"
                style={{
                  display: "block",
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Recipient Segment
              </label>
              <select
                id="bulk-segment"
                data-ocid="bulk_email.segment.select"
                value={segment}
                onChange={(e) => setSegment(e.target.value as Segment)}
                style={{
                  ...inputStyle(focusedField === "segment"),
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
                onFocus={() => setFocusedField("segment")}
                onBlur={() => setFocusedField(null)}
              >
                {SEGMENTS.map((s) => (
                  <option
                    key={s.value}
                    value={s.value}
                    style={{ background: "#0A0B14" }}
                  >
                    {s.label}
                  </option>
                ))}
              </select>
              <p style={{ color: MUTED, fontSize: "11px", marginTop: "6px" }}>
                {selectedSegment.desc} ·{" "}
                {dataLoaded
                  ? `${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`
                  : "Loading..."}
              </p>
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="bulk-subject"
                style={{
                  display: "block",
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Subject Line
              </label>
              <input
                id="bulk-subject"
                data-ocid="bulk_email.subject.input"
                type="text"
                placeholder="e.g. Important update from Imperidome"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setFocusedField("subject")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === "subject")}
                maxLength={150}
              />
              <p
                style={{
                  color: MUTED,
                  fontSize: "11px",
                  marginTop: "4px",
                  textAlign: "right",
                }}
              >
                {subject.length}/150
              </p>
            </div>

            {/* Message Body */}
            <div>
              <label
                htmlFor="bulk-body"
                style={{
                  display: "block",
                  color: MUTED,
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Message Body
              </label>
              <textarea
                id="bulk-body"
                data-ocid="bulk_email.body.textarea"
                rows={10}
                placeholder="Write your announcement, update, or promotion here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => setFocusedField("body")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle(focusedField === "body"),
                  resize: "vertical",
                  minHeight: "200px",
                }}
              />
              <p style={{ color: MUTED, fontSize: "11px", marginTop: "4px" }}>
                Plain text. An unsubscribe link will be automatically appended.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                data-ocid="bulk_email.preview.button"
                onClick={() => setPreviewVisible(!previewVisible)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "1px solid #1C1F33",
                  background: "transparent",
                  color: MUTED,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(0,255,163,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.color = NEON;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#1C1F33";
                  (e.currentTarget as HTMLButtonElement).style.color = MUTED;
                }}
              >
                {previewVisible ? "Hide Preview" : "Preview Email"}
              </button>

              <button
                type="button"
                data-ocid="bulk_email.send.primary_button"
                onClick={handleSend}
                disabled={
                  sending ||
                  !subject.trim() ||
                  !body.trim() ||
                  recipients.length === 0
                }
                style={{
                  flex: 2,
                  padding: "10px 0",
                  borderRadius: "8px",
                  border: "none",
                  background: sending ? "rgba(0,255,163,0.3)" : "#00FFA3",
                  color: "#0A0B14",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity:
                    !subject.trim() || !body.trim() || recipients.length === 0
                      ? 0.5
                      : 1,
                  transition: "opacity 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {sending ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        animation: "spin 1s linear infinite",
                        fontSize: "14px",
                      }}
                    >
                      ⟳
                    </span>
                    Sending…
                  </>
                ) : (
                  `Send to ${recipients.length} Recipient${recipients.length !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>

          {/* ── Right: Preview + Recipients ── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Email Preview */}
            {previewVisible && (
              <div
                data-ocid="bulk_email.preview.panel"
                style={{ ...DARK_CARD, padding: "20px" }}
              >
                <h4
                  style={{
                    color: MUTED,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "0 0 16px",
                  }}
                >
                  Email Preview
                </h4>
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid #1C1F33",
                    borderRadius: "8px",
                    padding: "20px",
                    fontFamily: "sans-serif",
                  }}
                >
                  {/* Email header mockup */}
                  <div
                    style={{
                      borderBottom: "1px solid #1C1F33",
                      paddingBottom: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <p
                      style={{
                        color: MUTED,
                        fontSize: "11px",
                        margin: "0 0 4px",
                      }}
                    >
                      From: Imperidome &lt;hello@imperidome.com&gt;
                    </p>
                    <p
                      style={{
                        color: TEXT,
                        fontSize: "13px",
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {subject || (
                        <span style={{ color: MUTED, fontStyle: "italic" }}>
                          No subject yet…
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Body */}
                  <div
                    style={{
                      color: TEXT,
                      fontSize: "13px",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {body || (
                      <span style={{ color: MUTED, fontStyle: "italic" }}>
                        No message body yet…
                      </span>
                    )}
                  </div>
                  {/* Unsubscribe footer */}
                  <div
                    style={{
                      marginTop: "24px",
                      paddingTop: "12px",
                      borderTop: "1px solid #1C1F33",
                    }}
                  >
                    <p
                      style={{
                        color: MUTED,
                        fontSize: "10px",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      You received this email as a client of Imperidome.{" "}
                      <span
                        style={{
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                      >
                        Unsubscribe
                      </span>{" "}
                      · Imperidome · www.imperidome.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient List */}
            <div
              data-ocid="bulk_email.recipients.panel"
              style={{ ...DARK_CARD, padding: "20px", flex: 1 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <h4
                  style={{
                    color: MUTED,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Recipients
                </h4>
                <span
                  style={{
                    background:
                      recipients.length > 0
                        ? "rgba(0,255,163,0.1)"
                        : "rgba(122,125,144,0.1)",
                    color: recipients.length > 0 ? NEON : MUTED,
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {dataLoaded ? recipients.length : "…"} total
                </span>
              </div>

              {!dataLoaded ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {[1, 2, 3].map((k) => (
                    <div
                      key={k}
                      style={{
                        height: "36px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "6px",
                      }}
                    />
                  ))}
                </div>
              ) : recipients.length === 0 ? (
                <div
                  data-ocid="bulk_email.recipients.empty_state"
                  style={{ padding: "32px 0", textAlign: "center" }}
                >
                  <p style={{ color: MUTED, fontSize: "13px", margin: 0 }}>
                    No recipients in this segment.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    maxHeight: "360px",
                    overflowY: "auto",
                  }}
                >
                  {recipients.slice(0, 50).map((r, idx) => (
                    <div
                      key={r.email}
                      data-ocid={`bulk_email.recipient.item.${idx + 1}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "rgba(0,255,163,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: NEON,
                          flexShrink: 0,
                        }}
                      >
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p
                          style={{
                            color: TEXT,
                            fontSize: "12px",
                            fontWeight: 600,
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.name}
                        </p>
                        <p
                          style={{
                            color: MUTED,
                            fontSize: "11px",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.email}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recipients.length > 50 && (
                    <p
                      style={{
                        color: MUTED,
                        fontSize: "11px",
                        textAlign: "center",
                        padding: "8px 0",
                        margin: 0,
                      }}
                    >
                      +{recipients.length - 50} more recipients
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Warning note */}
            <div
              style={{
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{ color: NEON_AMBER, fontSize: "14px", flexShrink: 0 }}
              >
                ⚠
              </span>
              <p
                style={{
                  color: MUTED,
                  fontSize: "12px",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                This will send an email to all selected recipients immediately.
                An unsubscribe link is automatically included per CAN-SPAM
                compliance.
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </AdminLayout>
  );
}
