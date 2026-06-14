import { CheckCircle, Star, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Review, backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StarDisplay({ rating }: { rating: bigint }) {
  const n = Number(rating);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= n ? "#fbbf24" : "none"}
          color={i <= n ? "#fbbf24" : "#3A3D52"}
          strokeWidth={1.5}
        />
      ))}
      <span
        style={{
          marginLeft: 6,
          fontSize: 12,
          color: "#7A7D90",
          fontWeight: 600,
        }}
      >
        {n}/5
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "rgba(250,204,21,0.15)",
      text: "#fbbf24",
      label: "PENDING",
    },
    approved: {
      bg: "rgba(94,240,138,0.15)",
      text: "#5EF08A",
      label: "APPROVED",
    },
    rejected: {
      bg: "rgba(239,68,68,0.15)",
      text: "#f87171",
      label: "REJECTED",
    },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

type ActionLoading = Record<string, "approving" | "rejecting" | null>;
type ActiveTab = "pending" | "approved" | "rejected";

interface ToastMsg {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastCounter = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  function showToast(message: string, type: "success" | "error" = "success") {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }

  return { toasts, showToast };
}

function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 99999,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          data-ocid="admin_reviews.toast"
          style={{
            background:
              t.type === "success"
                ? "rgba(17,32,24,0.98)"
                : "rgba(40,14,14,0.98)",
            border:
              t.type === "success"
                ? "1px solid rgba(94,240,138,0.4)"
                : "1px solid rgba(239,68,68,0.4)",
            borderRadius: 10,
            padding: "14px 20px",
            color: t.type === "success" ? "#5EF08A" : "#f87171",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            maxWidth: 360,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {t.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <XCircle size={16} />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        border: "2px solid rgba(255,255,255,0.2)",
        borderTop: "2px solid currentColor",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

interface ReviewCardProps {
  review: Review;
  variant: "pending" | "approved" | "rejected";
  actionState: "approving" | "rejecting" | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  index: number;
  onDelete?: (id: string) => void;
  onConfirmDelete?: (id: string) => void;
  confirmDeleteId?: string | null;
  onCancelDelete?: () => void;
}

function ReviewCard({
  review,
  variant,
  actionState,
  onApprove,
  onReject,
  index,
  onDelete,
  onConfirmDelete,
  confirmDeleteId,
  onCancelDelete,
}: ReviewCardProps) {
  const approving = actionState === "approving";
  const rejecting = actionState === "rejecting";
  const busy = approving || rejecting;

  return (
    <div
      data-ocid={`admin_reviews.item.${index}`}
      style={{
        background: "rgba(19,21,36,0.6)",
        border: "1px solid #1C1F33",
        borderRadius: 10,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 0.15s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ color: "#EEF0F8", fontWeight: 700, fontSize: 15 }}>
            {review.clientName || review.clientEmail}
          </span>
          {review.clientName && (
            <span style={{ color: "#7A7D90", fontSize: 12 }}>
              {review.clientEmail}
            </span>
          )}
          {review.jobTitle && (
            <span
              style={{
                color: "#a78bfa",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {review.jobTitle}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <StarDisplay rating={review.rating} />
          <span style={{ color: "#7A7D90", fontSize: 12 }}>
            {formatDate(review.submittedAt)}
          </span>
          {variant !== "pending" && <StatusBadge status={review.status} />}
        </div>
      </div>

      {/* Review text */}
      <p
        style={{
          color: "#C8CAD8",
          fontSize: 14,
          lineHeight: 1.65,
          margin: 0,
          fontStyle: "italic",
          borderLeft: "3px solid #1C1F33",
          paddingLeft: 14,
        }}
      >
        "{review.reviewText}"
      </p>

      {/* Action buttons — pending only */}
      {variant === "pending" && (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            data-ocid={`admin_reviews.approve_button.${index}`}
            onClick={() => onApprove?.(review.id)}
            disabled={busy}
            style={{
              background: approving
                ? "rgba(94,240,138,0.5)"
                : "rgba(94,240,138,0.12)",
              border: "1px solid rgba(94,240,138,0.4)",
              borderRadius: 7,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: "#5EF08A",
              cursor: busy ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "background 0.15s",
              opacity: busy && !approving ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(94,240,138,0.22)";
            }}
            onMouseOut={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(94,240,138,0.12)";
            }}
            onFocus={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(94,240,138,0.22)";
            }}
            onBlur={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(94,240,138,0.12)";
            }}
          >
            {approving ? <Spinner /> : <CheckCircle size={13} />}
            {approving ? "Approving…" : "Approve"}
          </button>

          <button
            type="button"
            data-ocid={`admin_reviews.reject_button.${index}`}
            onClick={() => onReject?.(review.id)}
            disabled={busy}
            style={{
              background: rejecting
                ? "rgba(239,68,68,0.35)"
                : "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 7,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: "#f87171",
              cursor: busy ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "background 0.15s",
              opacity: busy && !rejecting ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.2)";
            }}
            onMouseOut={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.1)";
            }}
            onFocus={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.2)";
            }}
            onBlur={(e) => {
              if (!busy)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.1)";
            }}
          >
            {rejecting ? <Spinner /> : <XCircle size={13} />}
            {rejecting ? "Rejecting…" : "Reject"}
          </button>
        </div>
      )}
      {onDelete && (
        <div style={{ marginTop: "0.5rem" }}>
          {confirmDeleteId === review.id ? (
            <span
              style={{
                display: "inline-flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#fbbf24", fontSize: "0.75rem" }}>
                Delete?
              </span>
              <button
                type="button"
                onClick={() => onConfirmDelete?.(review.id)}
                style={{
                  padding: "0.2rem 0.5rem",
                  background: "transparent",
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  borderRadius: "3px",
                }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                style={{
                  padding: "0.2rem 0.5rem",
                  background: "transparent",
                  border: "1px solid #888",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  borderRadius: "3px",
                }}
              >
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onDelete(review.id)}
              style={{
                padding: "0.25rem 0.75rem",
                background: "transparent",
                border: "1px solid #ef4444",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: "0.75rem",
                borderRadius: "3px",
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  const { actor, isFetching } = useActor();

  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [rejectedReviews, setRejectedReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<ActionLoading>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toasts, showToast } = useToast();

  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [pending, approved, rejected] = await Promise.all([
          (actor as backendInterface).getPendingReviews(),
          (actor as backendInterface).getApprovedReviews(),
          (actor as backendInterface).getRejectedReviews(),
        ]);
        setPendingReviews(pending ?? []);
        setApprovedReviews(approved ?? []);
        setRejectedReviews(rejected ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err ?? "");
        setError(
          msg.toLowerCase().includes("not authorized") ||
            msg.toLowerCase().includes("unauthorized")
            ? "You are not authorized to view reviews."
            : "Failed to load reviews. Please refresh the page.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [actor, isFetching]);

  async function handleApprove(reviewId: string) {
    if (!actor) return;
    setActionLoading((prev) => ({ ...prev, [reviewId]: "approving" }));
    try {
      const result = await (actor as backendInterface).approveReview(reviewId);
      if ("err" in result) {
        showToast(`Failed to approve: ${String(result.err)}`, "error");
      } else if ("ok" in result || "okAlreadyAdvanced" in result) {
        const review = pendingReviews.find((r) => r.id === reviewId);
        if (review) {
          setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId));
          setApprovedReviews((prev) =>
            [{ ...review, status: "approved" }, ...prev].sort((a, b) =>
              b.submittedAt > a.submittedAt
                ? 1
                : b.submittedAt < a.submittedAt
                  ? -1
                  : 0,
            ),
          );
        }
        showToast(
          "Review approved — it will now appear live on the front page",
        );
      } else {
        showToast("Unexpected response from server.", "error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed";
      showToast(msg, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [reviewId]: null }));
    }
  }

  async function handleReject(reviewId: string) {
    if (!actor) return;
    setActionLoading((prev) => ({ ...prev, [reviewId]: "rejecting" }));
    try {
      const result = await (actor as backendInterface).rejectReview(reviewId);
      if ("err" in result) {
        showToast(`Failed to reject: ${String(result.err)}`, "error");
      } else if ("ok" in result || "okAlreadyAdvanced" in result) {
        const review = pendingReviews.find((r) => r.id === reviewId);
        if (review) {
          setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId));
          setRejectedReviews((prev) =>
            [{ ...review, status: "rejected" }, ...prev].sort((a, b) =>
              b.submittedAt > a.submittedAt
                ? 1
                : b.submittedAt < a.submittedAt
                  ? -1
                  : 0,
            ),
          );
        }
        showToast("Review rejected");
      } else {
        showToast("Unexpected response from server.", "error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed";
      showToast(msg, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [reviewId]: null }));
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!actor) return;
    try {
      const result = await (actor as backendInterface).deleteReview(reviewId);
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setApprovedReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setRejectedReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setConfirmDeleteId(null);
        showToast("Review deleted successfully", "success");
      } else {
        showToast(
          "err" in result ? result.err : "Failed to delete review",
          "error",
        );
        setConfirmDeleteId(null);
      }
    } catch {
      showToast("Delete failed", "error");
      setConfirmDeleteId(null);
    }
  };

  const tabs: { key: ActiveTab; label: string; count?: number }[] = [
    { key: "pending", label: "Pending", count: pendingReviews.length },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const activeReviews =
    activeTab === "pending"
      ? pendingReviews
      : activeTab === "approved"
        ? approvedReviews
        : rejectedReviews;

  const emptyMessages: Record<ActiveTab, string> = {
    pending: "No pending reviews — all caught up!",
    approved:
      "No approved reviews yet. Approve a pending review to see it here.",
    rejected: "No rejected reviews yet.",
  };

  return (
    <AdminLayout pageTitle="Reviews">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .reviews-tabs-desktop { display: flex; }
        .reviews-hamburger-btn { display: none; }
        @media (max-width: 767px) {
          .reviews-tabs-desktop { display: none !important; }
          .reviews-hamburger-btn { display: flex !important; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          className="matrix-heading"
          style={{ fontSize: 22, margin: "0 0 4px 0" }}
        >
          <TypewriterText text="Reviews" speed={40} />
        </h1>
        <p className="matrix-muted" style={{ fontSize: 13, margin: 0 }}>
          Manage client testimonials — approve to publish live, reject to hide.
        </p>
      </div>

      {/* Tab bar — desktop: horizontal row; mobile: hamburger menu */}

      {/* Desktop tab row (hidden below 768px) */}
      <div
        className="reviews-tabs-desktop"
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling:
            "touch" as CSSProperties["WebkitOverflowScrolling"],
          scrollbarWidth: "none" as CSSProperties["scrollbarWidth"],
          msOverflowStyle: "none" as CSSProperties["msOverflowStyle"],
          overscrollBehavior: "contain",
          marginBottom: 20,
          borderBottom: "1px solid rgba(94,240,138,0.2)",
        }}
      >
        <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                data-ocid={`admin_reviews.${tab.key}.tab`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #5EF08A"
                    : "2px solid transparent",
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#5EF08A" : "#7A7D90",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(94,240,138,0.2)"
                        : "rgba(239,68,68,0.18)",
                      color: isActive ? "#5EF08A" : "#f87171",
                      borderRadius: 12,
                      padding: "1px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: "16px",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile hamburger trigger (hidden above 768px) */}
      <div
        className="reviews-hamburger-btn"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          borderBottom: "1px solid rgba(94,240,138,0.2)",
          paddingBottom: 12,
        }}
      >
        <span
          style={{
            color: "#5EF08A",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Courier New', monospace",
          }}
        >
          {tabs.find((t) => t.key === activeTab)?.label ?? "Reviews"}
          {(() => {
            const t = tabs.find((tab) => tab.key === activeTab);
            return t?.count !== undefined && t.count > 0 ? (
              <span
                style={{
                  marginLeft: 8,
                  background: "rgba(94,240,138,0.2)",
                  color: "#5EF08A",
                  borderRadius: 12,
                  padding: "1px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {t.count}
              </span>
            ) : null;
          })()}
        </span>
        <button
          type="button"
          data-ocid="admin_reviews.tabs_hamburger_button"
          onClick={() => setTabMenuOpen(true)}
          aria-label="Open tab menu"
          style={{
            background: "rgba(94,240,138,0.08)",
            border: "1px solid rgba(94,240,138,0.25)",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "#5EF08A",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
        </button>
      </div>

      {/* Fullscreen overlay — mobile tab menu */}
      {tabMenuOpen && (
        <div
          data-ocid="admin_reviews.tabs_mobile_overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(10,11,20,0.98)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px 16px",
              borderBottom: "1px solid rgba(94,240,138,0.2)",
            }}
          >
            <span
              style={{
                color: "#5EF08A",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'Courier New', monospace",
              }}
            >
              Select View
            </span>
            <button
              type="button"
              data-ocid="admin_reviews.tabs_mobile_close_button"
              onClick={() => setTabMenuOpen(false)}
              aria-label="Close tab menu"
              style={{
                background: "rgba(94,240,138,0.08)",
                border: "1px solid rgba(94,240,138,0.25)",
                borderRadius: 8,
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#5EF08A",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  data-ocid={`admin_reviews.${tab.key}.mobile_tab`}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setTabMenuOpen(false);
                  }}
                  style={{
                    background: isActive
                      ? "rgba(94,240,138,0.1)"
                      : "rgba(94,240,138,0.02)",
                    border: isActive
                      ? "1px solid rgba(94,240,138,0.35)"
                      : "1px solid rgba(94,240,138,0.1)",
                    borderRadius: 10,
                    padding: "0 20px",
                    minHeight: 52,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    color: isActive ? "#5EF08A" : "#7A7D90",
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 500,
                    transition: "background 0.15s, border-color 0.15s",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  <span>{tab.label}</span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        style={{
                          background: isActive
                            ? "rgba(94,240,138,0.2)"
                            : "rgba(239,68,68,0.18)",
                          color: isActive ? "#5EF08A" : "#f87171",
                          borderRadius: 12,
                          padding: "2px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <span style={{ color: "#5EF08A", fontSize: 16 }}>✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content card */}
      <div className="matrix-card" style={{ padding: "24px", minHeight: 200 }}>
        {loading && (
          <div
            data-ocid="admin_reviews.loading_state"
            className="matrix-muted"
            style={{ textAlign: "center", padding: "40px 0", fontSize: 14 }}
          >
            Loading reviews…
          </div>
        )}

        {!loading && error && (
          <div
            data-ocid="admin_reviews.error_state"
            style={{
              color: "#f87171",
              textAlign: "center",
              padding: "40px 0",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && activeReviews.length === 0 && (
          <div
            data-ocid="admin_reviews.empty_state"
            className="matrix-muted"
            style={{ textAlign: "center", padding: "48px 20px" }}
          >
            <Star
              size={36}
              color="rgba(94,240,138,0.2)"
              fill="rgba(94,240,138,0.1)"
              style={{
                marginBottom: 14,
                display: "block",
                margin: "0 auto 14px",
              }}
            />
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px 0" }}>
              {emptyMessages[activeTab]}
            </p>
          </div>
        )}

        {!loading && !error && activeReviews.length > 0 && (
          <div
            data-ocid={`admin_reviews.${activeTab}.list`}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {activeReviews.map((review, idx) => (
              <ReviewCard
                key={review.id}
                review={review}
                variant={activeTab}
                actionState={actionLoading[review.id] ?? null}
                onApprove={activeTab === "pending" ? handleApprove : undefined}
                onReject={activeTab === "pending" ? handleReject : undefined}
                index={idx + 1}
                onDelete={(id) => setConfirmDeleteId(id)}
                onConfirmDelete={(id) => handleDeleteReview(id)}
                confirmDeleteId={confirmDeleteId}
                onCancelDelete={() => setConfirmDeleteId(null)}
              />
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} />
    </AdminLayout>
  );
}
