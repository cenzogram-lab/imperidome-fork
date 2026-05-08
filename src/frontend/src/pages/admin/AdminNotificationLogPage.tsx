import {
  AlertTriangle,
  Bell,
  ExternalLink,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { NotificationLogEntry } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
function ConfirmDialog({
  onConfirm,
  onCancel,
  clearing,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  clearing: boolean;
}) {
  return (
    <div
      data-ocid="notification-log.dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#0E1020",
          border: "1px solid #1C1F33",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <Trash2 size={20} color="#f87171" />
        </div>
        <h3
          style={{
            color: "#EEF0F8",
            fontSize: "16px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Clear Notification Log?
        </h3>
        <p style={{ color: "#7A7D90", fontSize: "14px", marginBottom: "28px" }}>
          This will permanently delete all notification log entries. This action
          cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            data-ocid="notification-log.cancel_button"
            onClick={onCancel}
            disabled={clearing}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid #1C1F33",
              color: "#7A7D90",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="notification-log.confirm_button"
            onClick={onConfirm}
            disabled={clearing}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "10px",
              background: clearing
                ? "rgba(239,68,68,0.1)"
                : "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              fontSize: "14px",
              fontWeight: 600,
              cursor: clearing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {clearing ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Clearing…
              </>
            ) : (
              "Clear Log"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Event badge ──────────────────────────────────────────────────────────────
function EventBadge({ event }: { event: string }) {
  // Color-code common event types with gold/green/amber accents
  const palette: Record<string, { bg: string; text: string }> = {
    new_client: { bg: "rgba(94,240,138,0.12)", text: "#5EF08A" },
    new_order: { bg: "rgba(184,134,11,0.15)", text: "#d4a017" },
    new_lead: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" },
    invoice_paid: { bg: "rgba(94,240,138,0.12)", text: "#5EF08A" },
    edit_request: { bg: "rgba(139,92,246,0.12)", text: "#a78bfa" },
    questionnaire: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
    review: { bg: "rgba(249,115,22,0.12)", text: "#fb923c" },
  };

  // Try to match by substring
  const key = Object.keys(palette).find((k) => event.toLowerCase().includes(k));
  const colors = key
    ? palette[key]
    : { bg: "rgba(122,125,144,0.12)", text: "#7A7D90" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "6px",
        background: colors.bg,
        color: colors.text,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {event}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminNotificationLogPage() {
  const { actor, isFetching } = useActor();
  const [entries, setEntries] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const adminEmail = getAdminEmail();

  const fetchLog = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      const result = await actor.getNotificationLog(adminEmail);
      if ("ok" in result) {
        setEntries(result.ok);
      } else if ("err" in result) {
        setError(String(result.err));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notification log.",
      );
    } finally {
      setLoading(false);
    }
  }, [actor, adminEmail]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchLog();
  }, [actor, isFetching, fetchLog]);

  async function handleClearLog() {
    if (!actor) return;
    setClearing(true);
    setClearError(null);
    try {
      const result = await actor.clearNotificationLog(adminEmail);
      if ("ok" in result) {
        setEntries([]);
        setClearSuccess(true);
        setTimeout(() => setClearSuccess(false), 3000);
        setShowConfirm(false);
      } else if ("err" in result) {
        setClearError(String(result.err));
        setShowConfirm(false);
      }
    } catch (err) {
      setClearError(
        err instanceof Error ? err.message : "Failed to clear log.",
      );
      setShowConfirm(false);
    } finally {
      setClearing(false);
    }
  }

  return (
    <AdminLayout pageTitle="Notification Log">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {showConfirm && (
        <ConfirmDialog
          onConfirm={handleClearLog}
          onCancel={() => setShowConfirm(false)}
          clearing={clearing}
        />
      )}

      <div style={{ maxWidth: "1100px" }}>
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(184,134,11,0.12)",
                border: "1px solid rgba(184,134,11,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <History size={20} color="#d4a017" />
            </div>
            <div>
              <h1
                style={{
                  color: "#EEF0F8",
                  fontSize: "20px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Notification Log
              </h1>
              <p
                style={{ color: "#7A7D90", fontSize: "13px", marginTop: "2px" }}
              >
                All push notifications sent from this admin panel, newest first.
              </p>
            </div>
          </div>

          {/* Clear Log button */}
          <button
            type="button"
            data-ocid="notification-log.clear_log.button"
            onClick={() => {
              setClearError(null);
              setShowConfirm(true);
            }}
            disabled={loading || entries.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 18px",
              borderRadius: "10px",
              background:
                loading || entries.length === 0
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(239,68,68,0.1)",
              border:
                loading || entries.length === 0
                  ? "1px solid #1C1F33"
                  : "1px solid rgba(239,68,68,0.3)",
              color: loading || entries.length === 0 ? "#3A3D52" : "#f87171",
              fontSize: "13px",
              fontWeight: 600,
              cursor:
                loading || entries.length === 0 ? "not-allowed" : "pointer",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <Trash2 size={14} />
            Clear Log
          </button>
        </div>

        {/* ── Success / error banners ───────────────────────────────────────── */}
        {clearSuccess && (
          <div
            data-ocid="notification-log.clear.success_state"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(94,240,138,0.08)",
              border: "1px solid rgba(94,240,138,0.2)",
              marginBottom: "20px",
            }}
          >
            <Bell size={14} color="#5EF08A" />
            <p style={{ color: "#5EF08A", fontSize: "13px", fontWeight: 500 }}>
              Notification log cleared successfully.
            </p>
          </div>
        )}
        {clearError && (
          <div
            data-ocid="notification-log.clear.error_state"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              marginBottom: "20px",
            }}
          >
            <AlertTriangle size={14} color="#f87171" />
            <p style={{ color: "#f87171", fontSize: "13px" }}>{clearError}</p>
          </div>
        )}

        {/* ── Table card ───────────────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(14,16,32,0.9)",
            border: "1px solid #1C1F33",
            borderRadius: "16px",
            overflowX: "auto",
            WebkitOverflowScrolling:
              "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          }}
        >
          {/* Loading */}
          {loading && (
            <div
              data-ocid="notification-log.loading_state"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "64px 24px",
                color: "#7A7D90",
                fontSize: "14px",
              }}
            >
              <Loader2
                size={20}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Loading notification log…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              data-ocid="notification-log.error_state"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                padding: "64px 24px",
              }}
            >
              <AlertTriangle size={24} color="#f87171" />
              <p style={{ color: "#f87171", fontSize: "14px" }}>{error}</p>
              <button
                type="button"
                onClick={fetchLog}
                style={{
                  marginTop: "8px",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid #1C1F33",
                  color: "#7A7D90",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && entries.length === 0 && (
            <div
              data-ocid="notification-log.empty_state"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "72px 24px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(122,125,144,0.08)",
                  border: "1px solid #1C1F33",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={24} color="#3A3D52" />
              </div>
              <p
                style={{
                  color: "#7A7D90",
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                No notifications have been sent yet.
              </p>
              <p style={{ color: "#3A3D52", fontSize: "13px", margin: 0 }}>
                Notifications will appear here as events trigger them.
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && entries.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(140px,1.5fr) minmax(160px,2fr) minmax(200px,3fr) minmax(160px,2fr) 140px",
                  gap: "0",
                  padding: "0 24px",
                  borderBottom: "1px solid #1C1F33",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {["Event", "Title", "Body", "URL", "Timestamp"].map((col) => (
                  <div
                    key={col}
                    style={{
                      padding: "12px 12px 12px 0",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "rgba(122,125,144,0.7)",
                      textTransform: "uppercase",
                    }}
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Table rows */}
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  data-ocid={`notification-log.item.${idx + 1}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(140px,1.5fr) minmax(160px,2fr) minmax(200px,3fr) minmax(160px,2fr) 140px",
                    gap: "0",
                    padding: "0 24px",
                    borderBottom:
                      idx < entries.length - 1 ? "1px solid #1C1F33" : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.015)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                  }}
                >
                  {/* Event */}
                  <div
                    style={{
                      padding: "16px 12px 16px 0",
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    <EventBadge event={entry.event} />
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      padding: "16px 12px 16px 0",
                      color: "#EEF0F8",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {entry.title}
                    </span>
                  </div>

                  {/* Body */}
                  <div
                    style={{
                      padding: "16px 12px 16px 0",
                      color: "#7A7D90",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {entry.body}
                    </span>
                  </div>

                  {/* URL */}
                  <div
                    style={{
                      padding: "16px 12px 16px 0",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    {isValidUrl(entry.url) ? (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#d4a017",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 500,
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                        >
                          {entry.url.replace(/^https?:\/\/[^/]+/, "") || "/"}
                        </span>
                        <ExternalLink size={11} style={{ flexShrink: 0 }} />
                      </a>
                    ) : (
                      <span
                        style={{
                          color: "#3A3D52",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.url || "—"}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div
                    style={{
                      padding: "16px 0 16px 0",
                      color: "#4A4D62",
                      fontSize: "11px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "flex-start",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer count */}
          {!loading && !error && entries.length > 0 && (
            <div
              style={{
                padding: "12px 24px",
                borderTop: "1px solid #1C1F33",
                background: "rgba(255,255,255,0.015)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "#4A4D62", fontSize: "12px" }}>
                {entries.length} notification{entries.length !== 1 ? "s" : ""}{" "}
                in log
              </span>
              <span style={{ color: "#3A3D52", fontSize: "11px" }}>
                Sorted newest first
              </span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
