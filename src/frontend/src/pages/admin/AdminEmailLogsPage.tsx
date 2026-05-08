import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { EmailLog } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(ts: bigint): string {
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

  const fetchLogs = useCallback(async () => {
    if (!actor) return;
    const adminEmail = getAdminEmail();
    setError(null);
    try {
      const data = await (
        actor as unknown as {
          getEmailLogs(adminEmail: string): Promise<EmailLog[]>;
        }
      ).getEmailLogs(adminEmail);
      // Sort newest first
      const sorted = [...data].sort((a, b) =>
        Number(b.timestamp - a.timestamp),
      );
      setLogs(sorted);
    } catch {
      setError("Failed to load email logs.");
    }
  }, [actor]);

  // Initial load
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
        {/* ── Page Header ──────────────────────────────────────────────────── */}
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
              style={{
                color: "#EEF0F8",
                fontWeight: 700,
                fontSize: 22,
                margin: "0 0 4px",
              }}
            >
              Email Logs
            </h2>
            <p style={{ color: "#7A7D90", fontSize: 13, margin: 0 }}>
              All outgoing email activity
            </p>
          </div>

          <button
            type="button"
            data-ocid="email_logs.refresh.button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(94,240,138,0.1)",
              border: "1px solid rgba(94,240,138,0.25)",
              color: "#5EF08A",
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: refreshing || loading ? "not-allowed" : "pointer",
              opacity: refreshing || loading ? 0.6 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!refreshing && !loading)
                e.currentTarget.style.background = "rgba(94,240,138,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(94,240,138,0.1)";
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

        {/* ── Error ────────────────────────────────────────────────────────── */}
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

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div
          data-ocid="email_logs.table"
          style={{
            background: "rgba(17,19,34,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1C1F33",
            borderRadius: 8,
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 640,
            }}
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
                      color: "#7A7D90",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid #1C1F33",
                      whiteSpace: "nowrap",
                      background: "rgba(14,16,32,0.6)",
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
                          color: "#EEF0F8",
                          fontWeight: 600,
                          fontSize: 15,
                          margin: 0,
                        }}
                      >
                        No email logs yet.
                      </p>
                      <p
                        style={{
                          color: "#7A7D90",
                          fontSize: 13,
                          margin: 0,
                          maxWidth: 280,
                        }}
                      >
                        Email delivery records will appear here once the system
                        sends its first email.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className="logs-row"
                    data-ocid={`email_logs.row.${idx + 1}`}
                    style={{ borderBottom: "1px solid #1C1F33" }}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ color: "#9DA0B3", fontSize: 13 }}>
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>

                    {/* Recipient Email */}
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          color: "#EEF0F8",
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        {log.recipientEmail || "—"}
                      </span>
                    </td>

                    {/* Template Name */}
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          color: "#7A7D90",
                          fontSize: 12,
                          background: "rgba(122,125,144,0.1)",
                          border: "1px solid rgba(122,125,144,0.2)",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontFamily: "monospace",
                        }}
                      >
                        {log.templateName || "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Record count ─────────────────────────────────────────────────── */}
        {!loading && !error && logs.length > 0 && (
          <p
            style={{
              color: "#7A7D90",
              fontSize: 12,
              textAlign: "right",
              margin: 0,
            }}
          >
            {logs.length} {logs.length === 1 ? "record" : "records"}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
