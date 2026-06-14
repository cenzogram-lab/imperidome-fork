import { Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Review, backendInterface } from "../../backend.d";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

function formatTimestamp(ts: bigint): string {
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
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            fontSize: "20px",
            color: i <= n ? "#F59E0B" : "rgba(94,240,138,0.15)",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
      <span
        style={{
          fontSize: "13px",
          color: "#5EF08A",
          marginLeft: "6px",
          fontWeight: 600,
          fontFamily: "monospace",
        }}
      >
        {n} / 5
      </span>
    </div>
  );
}

function StarSelector({
  value,
  onChange,
  disabled,
}: { value: number; onChange: (n: number) => void; disabled: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div
      style={{ display: "flex", gap: "6px" }}
      onMouseLeave={() => setHovered(0)}
      aria-label="Star rating selector"
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            data-ocid={`reviews.star.${i}`}
            aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
            disabled={disabled}
            onMouseEnter={() => setHovered(i)}
            onClick={() => onChange(i)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: disabled ? "default" : "pointer",
              fontSize: "32px",
              minWidth: "44px",
              minHeight: "44px",
              lineHeight: 1,
              color: filled ? "#F59E0B" : "rgba(94,240,138,0.15)",
              transition: "color 0.15s, transform 0.1s",
              transform:
                hovered === i && !disabled ? "scale(1.15)" : "scale(1)",
            }}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "approved")
    return (
      <span className="matrix-badge" style={{ fontSize: "12px" }}>
        Approved
      </span>
    );
  if (s === "rejected")
    return (
      <span className="matrix-badge-red" style={{ fontSize: "12px" }}>
        Not Approved
      </span>
    );
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: "rgba(234,179,8,0.1)",
        color: "#EAB308",
        border: "1px solid rgba(234,179,8,0.3)",
      }}
    >
      Pending Review
    </span>
  );
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

function Toast({
  toast,
  onDismiss,
}: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      data-ocid="reviews.toast"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        padding: "14px 20px",
        borderRadius: "10px",
        background:
          toast.type === "success"
            ? "rgba(5,46,22,0.97)"
            : "rgba(69,10,10,0.97)",
        border: `1px solid ${toast.type === "success" ? "rgba(94,240,138,0.4)" : "rgba(239,68,68,0.4)"}`,
        color: toast.type === "success" ? "#86EFAC" : "#FCA5A5",
        fontSize: "14px",
        fontWeight: 600,
        maxWidth: "380px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 0,
          opacity: 0.6,
          fontSize: "16px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function ExistingReviewCard({ review }: { review: Review }) {
  const status = review.status.toLowerCase();
  const infoMsg: Record<string, { text: string; color: string }> = {
    pending: {
      text: "Your review is being reviewed by our team. You'll receive an email when it's approved.",
      color: "#EAB308",
    },
    approved: { text: "Your review is live on our website!", color: "#5EF08A" },
    rejected: {
      text: "Your review was not approved for public display.",
      color: "#EF4444",
    },
  };
  const info = infoMsg[status];
  return (
    <div
      data-ocid="reviews.existing-review.card"
      className="matrix-card"
      style={{
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        border: "1px solid rgba(94,240,138,0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 8px" }}>
            <TypewriterText
              text="Your Review"
              className="matrix-heading"
              style={{ fontSize: "18px", fontWeight: 700 }}
              speed={40}
            />
          </h2>
          <StarDisplay rating={review.rating} />
        </div>
        <StatusBadge status={review.status} />
      </div>
      <p
        data-ocid="reviews.existing-review.text"
        style={{
          margin: 0,
          fontSize: "15px",
          color: "#B0B3C6",
          lineHeight: "1.65",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        "{review.reviewText}"
      </p>
      {review.jobTitle && review.jobTitle.trim() !== "" && (
        <p
          data-ocid="reviews.existing-review.job-title"
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#5EF08A",
            fontWeight: 600,
            fontFamily: "monospace",
          }}
        >
          {review.jobTitle}
        </p>
      )}
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          color: "#7A7D90",
          letterSpacing: "0.02em",
          fontFamily: "monospace",
        }}
      >
        Submitted {formatTimestamp(review.submittedAt)}
      </p>
      {info && (
        <div
          data-ocid="reviews.existing-review.status-message"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "rgba(94,240,138,0.04)",
            border: "1px solid rgba(94,240,138,0.1)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: info.color,
              lineHeight: "1.55",
            }}
          >
            {info.text}
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  clientEmail,
  actor,
  onSubmitted,
  onToast,
}: {
  clientEmail: string;
  actor: {
    submitReview: (
      clientEmail: string,
      rating: bigint,
      reviewText: string,
      jobTitle: string,
    ) => Promise<{ ok: string } | { err: string }>;
  };
  onSubmitted: () => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = rating >= 1 && reviewText.trim().length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await actor.submitReview(
        clientEmail,
        BigInt(rating),
        reviewText.trim(),
        jobTitle.trim(),
      );
      if ("ok" in result) {
        onToast(
          "Review submitted! We'll notify you when it's approved.",
          "success",
        );
        setRating(0);
        setReviewText("");
        setJobTitle("");
        onSubmitted();
      } else {
        onToast(
          result.err || "Failed to submit review. Please try again.",
          "error",
        );
      }
    } catch {
      onToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputFocusStyle = {
    borderColor: "rgba(94,240,138,0.5)",
    boxShadow: "0 0 0 2px rgba(94,240,138,0.1)",
  };
  const inputBlurStyle = { borderColor: "rgba(94,240,138,0.15)" };

  return (
    <div
      data-ocid="reviews.form.card"
      className="matrix-card"
      style={{ padding: "28px", border: "1px solid rgba(94,240,138,0.15)" }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ margin: "0 0 6px" }}>
          <TypewriterText
            text="Leave a Review"
            className="matrix-heading"
            style={{ fontSize: "20px", fontWeight: 700 }}
            speed={40}
          />
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#7A7D90",
            lineHeight: "1.5",
          }}
        >
          Share your experience working with Imperidome
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div data-ocid="reviews.form.rating-section">
            <p
              id="rating-label"
              style={{
                margin: "0 0 10px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#5EF08A",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "monospace",
              }}
            >
              Your Rating <span style={{ color: "#EF4444" }}>*</span>
            </p>
            <fieldset
              aria-labelledby="rating-label"
              style={{ border: "none", margin: 0, padding: 0 }}
            >
              <StarSelector
                value={rating}
                onChange={setRating}
                disabled={submitting}
              />
            </fieldset>
            {rating === 0 && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "12px",
                  color: "#7A7D90",
                }}
              >
                Select a star to rate your experience
              </p>
            )}
          </div>
          <div data-ocid="reviews.form.text-section">
            <label
              htmlFor="review-text"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#5EF08A",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "monospace",
              }}
            >
              Your Review <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              id="review-text"
              data-ocid="reviews.form.textarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value.slice(0, 1000))}
              placeholder="Tell us about your experience..."
              rows={5}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "rgba(7,8,16,0.8)",
                border: "1px solid rgba(94,240,138,0.15)",
                color: "#EEF0F8",
                fontSize: "15px",
                lineHeight: "1.6",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
            />
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: reviewText.length >= 950 ? "#EAB308" : "#7A7D90",
                textAlign: "right",
                fontFamily: "monospace",
              }}
            >
              {reviewText.length} / 1000
            </p>
          </div>
          <div data-ocid="reviews.form.job-title-section">
            <label
              htmlFor="review-job-title"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#5EF08A",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "monospace",
              }}
            >
              Job Title / Company
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "11px",
                  color: "#7A7D90",
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (optional)
              </span>
            </label>
            <input
              id="review-job-title"
              data-ocid="reviews.form.job-title-input"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Your job title or company (optional)"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                background: "rgba(7,8,16,0.8)",
                border: "1px solid rgba(94,240,138,0.15)",
                color: "#EEF0F8",
                fontSize: "15px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              data-ocid="reviews.form.submit-button"
              disabled={!canSubmit}
              className={canSubmit ? "matrix-btn" : "matrix-btn-outline"}
              style={{
                padding: "12px 28px",
                minWidth: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                  Submitting…
                </>
              ) : (
                <>
                  <Star size={15} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      <style>
        {
          "@keyframes spin { to { transform: rotate(360deg); } } textarea:disabled, input:disabled { opacity: 0.6; cursor: not-allowed; }"
        }
      </style>
    </div>
  );
}

export default function PortalReviewsPage() {
  const { session } = useSession();
  const clientEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();
  const [existingReview, setExistingReview] = useState<
    Review | null | undefined
  >(undefined);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is an intentional refresh trigger
  useEffect(() => {
    // Guard: do not fire until clientEmail is a non-empty string
    if (!actor || isFetching || !clientEmail) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await (actor as backendInterface).getMyReview(
          clientEmail,
        );
        if (!cancelled) setExistingReview(result ?? null);
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setExistingReview(null);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, clientEmail, refreshKey]);

  const isLoading = isFetching || existingReview === undefined;

  return (
    <PortalLayout pageTitle="Leave a Review">
      <div
        data-ocid="reviews.page"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "680px",
        }}
      >
        <div data-ocid="reviews.page-header" style={{ marginBottom: "4px" }}>
          <h1 style={{ margin: "0 0 4px" }}>
            <TypewriterText
              text="Reviews"
              className="matrix-heading"
              style={{ fontSize: "22px", fontWeight: 700 }}
              speed={45}
            />
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}>
            Share your feedback or track your submitted review.
          </p>
        </div>

        {isLoading && (
          <div
            data-ocid="reviews.loading_state"
            className="matrix-card"
            style={{
              padding: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "#7A7D90",
              fontSize: "14px",
            }}
          >
            <Loader2
              size={18}
              style={{ animation: "spin 0.8s linear infinite" }}
            />
            <span style={{ fontFamily: "monospace" }}>
              Loading your review status…
            </span>
          </div>
        )}

        {!isLoading && loadError && (
          <div
            data-ocid="reviews.error_state"
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(69,10,10,0.3)",
              padding: "20px 24px",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#FCA5A5" }}>
              Unable to load your review status. Please refresh the page and try
              again.
            </p>
          </div>
        )}

        {!isLoading && !loadError && existingReview === null && (
          <ReviewForm
            clientEmail={clientEmail}
            actor={actor as backendInterface}
            onSubmitted={() => {
              setExistingReview(undefined);
              setRefreshKey((prev) => prev + 1);
            }}
            onToast={(msg, type) => setToast({ message: msg, type })}
          />
        )}
        {!isLoading && !loadError && existingReview != null && (
          <ExistingReviewCard review={existingReview} />
        )}
      </div>

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </PortalLayout>
  );
}
