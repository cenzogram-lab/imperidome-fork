import {
  AlertTriangle,
  Bell,
  ExternalLink,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { NotificationLogEntry, backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

function formatTimestamp(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // currentPage is reset directly in handleClearLog after clearing

  const fetchLog = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      const result = await (actor as backendInterface).getNotificationLog();
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
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    fetchLog();
  }, [actor, isFetching, fetchLog]);

  async function handleClearLog() {
    if (!actor) return;
    setClearing(true);
    setClearError(null);
    try {
      const result = await (actor as backendInterface).clearNotificationLog();
      if ("ok" in result) {
        setEntries([]);
        setCurrentPage(1);
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
        {/* Page header */}
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
                background: "rgba(94,240,138,0.1)",
                border: "1px solid rgba(94,240,138,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <History size={20} color="#5EF08A" />
            </div>
            <div>
              <h1
                className="matrix-heading"
                style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}
              >
                <TypewriterText text="Notification Log" speed={40} />
              </h1>
              <p
                className="matrix-muted"
                style={{ fontSize: "13px", marginTop: "2px" }}
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
            className="matrix-btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 600,
              cursor:
                loading || entries.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || entries.length === 0 ? 0.4 : 1,
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#f87171",
              background: "rgba(239,68,68,0.07)",
              borderRadius: "10px",
            }}
          >
            <Trash2 size={14} />
            Clear Log
          </button>
        </div>

        {/* Success / error banners */}
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

        {/* Table card */}
        <div
          className="matrix-card"
          style={{
            borderRadius: "16px",
            overflowX: "auto",
            WebkitOverflowScrolling:
              "touch" as CSSProperties["WebkitOverflowScrolling"],
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
                color: "#5EF08A",
                fontSize: "14px",
                fontFamily: "'Courier New', monospace",
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
                className="matrix-btn-outline"
                style={{
                  marginTop: "8px",
                  padding: "8px 20px",
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
                  background: "rgba(94,240,138,0.06)",
                  border: "1px solid rgba(94,240,138,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={24} color="rgba(94,240,138,0.4)" />
              </div>
              <p
                className="matrix-muted"
                style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}
              >
                No notifications have been sent yet.
              </p>
              <p
                className="matrix-muted"
                style={{ fontSize: "13px", margin: 0 }}
              >
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
                  borderBottom: "1px solid rgba(94,240,138,0.15)",
                  background: "rgba(94,240,138,0.03)",
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
                      color: "rgba(94,240,138,0.7)",
                      textTransform: "uppercase",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Table rows */}
              {entries
                .slice(
                  (currentPage - 1) * rowsPerPage,
                  currentPage * rowsPerPage,
                )
                .map((entry, idx) => (
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
                        idx < entries.length - 1
                          ? "1px solid rgba(94,240,138,0.08)"
                          : "none",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(94,240,138,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "transparent";
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 12px 16px 0",
                        display: "flex",
                        alignItems: "flex-start",
                      }}
                    >
                      <EventBadge event={entry.event} />
                    </div>
                    <div
                      style={{
                        padding: "16px 12px 16px 0",
                        color: "#5EF08A",
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
                            color: "#5EF08A",
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
                          className="matrix-muted"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.url || "—"}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        padding: "16px 0 16px 0",
                        color: "rgba(94,240,138,0.5)",
                        fontSize: "11px",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "flex-start",
                        whiteSpace: "nowrap",
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Footer count + pagination */}
          {!loading &&
            !error &&
            entries.length > 0 &&
            (() => {
              const totalPages = Math.ceil(entries.length / rowsPerPage);
              return (
                <div
                  style={{
                    padding: "12px 24px",
                    borderTop: "1px solid rgba(94,240,138,0.1)",
                    background: "rgba(94,240,138,0.02)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span className="matrix-muted" style={{ fontSize: "12px" }}>
                    {entries.length} notification
                    {entries.length !== 1 ? "s" : ""} in log
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: "#5EF08A",
                        fontSize: "12px",
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      Page {currentPage} of {totalPages}
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        style={{
                          padding: "4px 12px",
                          background: "transparent",
                          border: "1px solid #5EF08A",
                          borderRadius: "6px",
                          color: "#5EF08A",
                          fontSize: "12px",
                          fontFamily: "'Courier New', monospace",
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          opacity: currentPage === 1 ? 0.5 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        style={{
                          padding: "4px 12px",
                          background: "transparent",
                          border: "1px solid #5EF08A",
                          borderRadius: "6px",
                          color: "#5EF08A",
                          fontSize: "12px",
                          fontFamily: "'Courier New', monospace",
                          cursor:
                            currentPage === totalPages
                              ? "not-allowed"
                              : "pointer",
                          opacity: currentPage === totalPages ? 0.5 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </AdminLayout>
  );
}
