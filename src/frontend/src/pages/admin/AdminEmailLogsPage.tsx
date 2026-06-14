import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { EmailLog, backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { ADMIN_EMAIL_KEY } from "../../constants";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isSent = status.toLowerCase() === "sent";
  return (
    <span
      style={{
        background: isSent ? "rgba(94,240,138,0.12)" : "rgba(239,68,68,0.12)",
        color: isSent ? "#5EF08A" : "#f87171",
        border: `1px solid ${isSent ? "rgba(94,240,138,0.3)" : "rgba(239,68,68,0.3)"}`,
        borderRadius: 5,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {isSent ? "Sent" : "Failed"}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #1C1F33" }}>
      {Array.from({ length: cols }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <td key={i} style={{ padding: "14px 16px" }}>
          <div
            style={{
              height: 13,
              width: "75%",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 4,
              animation: "skelPulse 1.5s ease-in-out infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const COLS = ["Timestamp", "Recipient Email", "Template Name", "Status"];
const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

export default function AdminEmailLogsPage() {
  const { actor, isFetching } = useActor();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    if (!adminEmail) return;
    setError(null);
    try {
      const data = await (actor as backendInterface).getEmailLogs();
      const sorted = [...data].sort((a, b) =>
        b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0,
      );
      setLogs(sorted);
      setCurrentPage(1);
    } catch {
      setError("Failed to load email logs.");
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    fetchLogs().finally(() => setLoading(false));
  }, [actor, isFetching, fetchLogs]);

  async function handleRefresh() {
    if (!actor || refreshing) return;
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }

  return (
    <AdminLayout pageTitle="Email Logs">
      <style>{`
        @keyframes skelPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .logs-row:hover td {
          background: rgba(94,240,138,0.02) !important;
        }
        .logs-row td {
          transition: background 0.1s;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Page Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              className="matrix-heading"
              style={{ fontWeight: 700, fontSize: 22, margin: "0 0 4px" }}
            >
              <TypewriterText text="Email Logs" speed={40} />
            </h2>
            <p className="matrix-muted" style={{ fontSize: 13, margin: 0 }}>
              All outgoing email activity
            </p>
          </div>

          <button
            type="button"
            data-ocid="email_logs.refresh.button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="matrix-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: refreshing || loading ? "not-allowed" : "pointer",
              opacity: refreshing || loading ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing
                  ? "skelPulse 0.8s ease-in-out infinite"
                  : "none",
              }}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            data-ocid="email_logs.error_state"
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

        {/* Table */}
        <div
          data-ocid="email_logs.table"
          className="matrix-card"
          style={{ overflowX: "auto" }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}
          >
            <thead>
              <tr>
                {COLS.map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(94,240,138,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid rgba(94,240,138,0.15)",
                      whiteSpace: "nowrap",
                      background: "rgba(0,0,0,0.3)",
                      fontFamily: "'Courier New', monospace",
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
                  <SkeletonRow key={k} cols={COLS.length} />
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    data-ocid="email_logs.empty_state"
                    colSpan={COLS.length}
                    style={{ padding: "60px 20px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "rgba(94,240,138,0.08)",
                          border: "1px solid rgba(94,240,138,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        📭
                      </div>
                      <p
                        style={{
                          color: "#5EF08A",
                          fontWeight: 600,
                          fontSize: 15,
                          margin: 0,
                        }}
                      >
                        No email logs yet.
                      </p>
                      <p
                        className="matrix-muted"
                        style={{ fontSize: 13, margin: 0, maxWidth: 280 }}
                      >
                        Email delivery records will appear here once the system
                        sends its first email.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const visibleLogs = logs.slice(
                    (currentPage - 1) * PAGE_SIZE,
                    currentPage * PAGE_SIZE,
                  );
                  return visibleLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className="logs-row"
                      data-ocid={`email_logs.row.${idx + 1}`}
                      style={{
                        borderBottom: "1px solid rgba(94,240,138,0.08)",
                      }}
                    >
                      <td
                        style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                      >
                        <span className="matrix-muted" style={{ fontSize: 13 }}>
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            color: "#5EF08A",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {log.recipientEmail || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            color: "rgba(94,240,138,0.7)",
                            fontSize: 12,
                            background: "rgba(94,240,138,0.06)",
                            border: "1px solid rgba(94,240,138,0.15)",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontFamily: "'Courier New', monospace",
                          }}
                        >
                          {log.templateName || "—"}
                        </span>
                      </td>
                      <td
                        style={{ padding: "13px 16px", whiteSpace: "nowrap" }}
                      >
                        <StatusBadge status={log.status} />
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && logs.length > PAGE_SIZE && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <p className="matrix-muted" style={{ fontSize: 12, margin: 0 }}>
              Page {currentPage} of{" "}
              {Math.max(1, Math.ceil(logs.length / PAGE_SIZE))} &mdash;{" "}
              {logs.length} records
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                data-ocid="email_logs.pagination_prev"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="matrix-btn"
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  opacity: currentPage === 1 ? 0.4 : 1,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Previous
              </button>
              <button
                type="button"
                data-ocid="email_logs.pagination_next"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(
                      Math.max(1, Math.ceil(logs.length / PAGE_SIZE)),
                      p + 1,
                    ),
                  )
                }
                disabled={
                  currentPage >= Math.max(1, Math.ceil(logs.length / PAGE_SIZE))
                }
                className="matrix-btn"
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  opacity:
                    currentPage >=
                    Math.max(1, Math.ceil(logs.length / PAGE_SIZE))
                      ? 0.4
                      : 1,
                  cursor:
                    currentPage >=
                    Math.max(1, Math.ceil(logs.length / PAGE_SIZE))
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Record count — shown when logs fit on one page */}
        {!loading && !error && logs.length > 0 && logs.length <= PAGE_SIZE && (
          <p
            className="matrix-muted"
            style={{ fontSize: 12, textAlign: "right", margin: 0 }}
          >
            {logs.length} {logs.length === 1 ? "record" : "records"}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
