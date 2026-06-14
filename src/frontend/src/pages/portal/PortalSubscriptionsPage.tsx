import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type {
  BillingHistory,
  Subscription,
  UpsertResult,
  backendInterface,
} from "../../backend.d";
import { EditableText } from "../../components/EditableText";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

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

function formatBillingCycle(cycle: string): string {
  const c = cycle.toLowerCase();
  if (c === "monthly") return "Monthly";
  if (c === "quarterly") return "Quarterly";
  if (c === "annually" || c === "annual") return "Annually";
  return cycle.charAt(0).toUpperCase() + cycle.slice(1);
}

function isPastStatus(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s === "cancelled" ||
    s === "canceled" ||
    s === "cancellation_requested" ||
    s === "cancellation requested"
  );
}

function Skeleton({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(94,240,138,0.05)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        border: "1px solid rgba(94,240,138,0.1)",
        ...style,
      }}
    />
  );
}

function SubBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 12px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          background: "rgba(234,179,8,0.12)",
          color: "#EAB308",
          border: "1px solid rgba(234,179,8,0.35)",
        }}
      >
        AWAITING ACTIVATION
      </span>
    );
  }
  if (s === "active") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 12px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          background: "rgba(94,240,138,0.15)",
          color: "#5EF08A",
          border: "1px solid rgba(94,240,138,0.35)",
        }}
      >
        ACTIVE
      </span>
    );
  }
  if (s === "cancelled" || s === "canceled") {
    return <span className="matrix-badge-red">CANCELLED</span>;
  }
  if (s === "cancellation_requested" || s === "cancellation requested") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 12px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          background: "rgba(234,179,8,0.12)",
          color: "#EAB308",
          border: "1px solid rgba(234,179,8,0.35)",
        }}
      >
        CANCELLATION REQUESTED
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: "rgba(107,114,128,0.2)",
        color: "#7A7D90",
        border: "1px solid rgba(107,114,128,0.3)",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function formatBillingDate(ts: bigint): string {
  if (ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function BillingBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "paid") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          background: "rgba(94,240,138,0.15)",
          color: "#5EF08A",
          border: "1px solid rgba(94,240,138,0.35)",
        }}
      >
        PAID
      </span>
    );
  }
  if (s === "failed") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          background: "rgba(239,68,68,0.12)",
          color: "#EF4444",
          border: "1px solid rgba(239,68,68,0.35)",
        }}
      >
        FAILED
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: "rgba(107,114,128,0.2)",
        color: "#7A7D90",
        border: "1px solid rgba(107,114,128,0.3)",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

const LABEL_STYLE: CSSProperties = {
  margin: "0 0 4px",
  fontSize: "12px",
  color: "#5EF08A",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  fontFamily: "monospace",
};

const VALUE_STYLE: CSSProperties = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: "#EEF0F8",
};

function SubscriptionRow({
  sub,
  index,
  onRequestCancel,
  showCancel,
  onUpdatePayment,
}: {
  sub: Subscription;
  index: number;
  onRequestCancel: (stripeId: string, planName: string) => void;
  showCancel: boolean;
  onUpdatePayment: () => void;
}) {
  const isActive = sub.status.toLowerCase() === "active";
  const isPending = sub.status.toLowerCase() === "pending";

  return (
    <>
      {sub.paymentFailed && !isPending && (
        <div
          data-ocid={`subscriptions.payment_failed.${index + 1}`}
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#EF4444",
              lineHeight: 1.5,
            }}
          >
            Your last payment for <strong>{sub.plan_name}</strong> failed.
            Please update your payment method.
          </p>
          <button
            type="button"
            data-ocid={`subscriptions.payment_failed_update.${index + 1}`}
            onClick={onUpdatePayment}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              background: "rgba(239,68,68,0.15)",
              color: "#EF4444",
              fontWeight: 600,
              fontSize: "12px",
              border: "1px solid rgba(239,68,68,0.4)",
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
            }}
          >
            Update Payment Method
          </button>
        </div>
      )}
      <div
        data-ocid={`subscriptions.item.${index + 1}`}
        className="matrix-card"
        style={{
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px 24px",
          animation: "typewriter-fade-in 0.4s ease forwards",
        }}
      >
        <div>
          <p style={LABEL_STYLE}>Service</p>
          <p style={VALUE_STYLE}>{sub.plan_name}</p>
        </div>
        <div>
          <p style={LABEL_STYLE}>Billing</p>
          <p style={VALUE_STYLE}>{formatBillingCycle(sub.billing_cycle)}</p>
        </div>
        <div>
          <p style={LABEL_STYLE}>Next Billing Date</p>
          <p style={{ ...VALUE_STYLE, fontFamily: "monospace" }}>
            {isPending ? "—" : formatDate(sub.nextBillingDate)}
          </p>
        </div>
        <div>
          <p style={LABEL_STYLE}>Status</p>
          <SubBadge status={sub.status} />
          {isPending && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#7A7D90",
                lineHeight: 1.5,
              }}
            >
              Your subscription will be activated by the Imperidome team. You
              will be notified when billing begins.
            </p>
          )}
        </div>
        {showCancel && isActive && !isPending && (
          <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
            <button
              type="button"
              data-ocid={`subscriptions.cancel_button.${index + 1}`}
              onClick={() =>
                onRequestCancel(sub.stripe_subscription_id, sub.plan_name)
              }
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.1)",
                color: "#EF4444",
                fontWeight: 600,
                fontSize: "13px",
                border: "1px solid rgba(239,68,68,0.4)",
                cursor: "pointer",
              }}
            >
              Request Cancellation
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function PortalSubscriptionsPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [subscriptions, setSubscriptions] = useState<
    Subscription[] | undefined
  >(undefined);
  const [loadError, setLoadError] = useState(false);

  // Dismissed cancellation banners — keyed by subscription id as string
  const [dismissedCancelBanners, setDismissedCancelBanners] = useState<
    Set<string>
  >(new Set());

  function dismissCancelBanner(subId: string) {
    setDismissedCancelBanners((prev) => {
      const next = new Set(prev);
      next.add(subId);
      return next;
    });
  }

  // Billing history state
  const [billingHistory, setBillingHistory] = useState<
    BillingHistory[] | undefined
  >(undefined);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Update payment method state
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Cancel modal state
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [pendingCancelName, setPendingCancelName] = useState<string | null>(
    null,
  );
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  // Pending checkout banner state
  const [showPendingBanner, setShowPendingBanner] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryCount is an intentional re-fetch trigger
  useEffect(() => {
    if (!actor || !userEmail || isFetching) return;
    setLoadError(false);
    const a = actor as unknown as backendInterface;
    a.getMySubscriptions()
      .then((subs) => {
        // Newest-first: b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0
        const sorted = [...subs].sort((a2, b2) =>
          b2.created_at > a2.created_at
            ? 1
            : b2.created_at < a2.created_at
              ? -1
              : 0,
        );
        setSubscriptions(sorted);
      })
      .catch(() => {
        setLoadError(true);
      });
  }, [actor, isFetching, userEmail, retryCount]);

  // Check for pending checkout redirect on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pending") === "true") {
      setShowPendingBanner(true);
    }
  }, []);

  // Fetch billing history on mount (after actor ready)
  useEffect(() => {
    if (!actor || !userEmail || isFetching) return;
    setBillingLoading(true);
    setBillingError(null);
    const a = actor as unknown as backendInterface;
    a.getMyBillingHistory()
      .then((records) => {
        // Newest-first by payment_date
        const sorted = [...records].sort((a2, b2) =>
          b2.payment_date > a2.payment_date
            ? 1
            : b2.payment_date < a2.payment_date
              ? -1
              : 0,
        );
        setBillingHistory(sorted);
      })
      .catch(() => {
        setBillingError("Could not load billing history. Please try again.");
      })
      .finally(() => {
        setBillingLoading(false);
      });
  }, [actor, isFetching, userEmail]);

  const isLoading = isFetching || (subscriptions === undefined && !loadError);

  function openCancelModal(stripeId: string, planName: string) {
    setPendingCancelId(stripeId);
    setPendingCancelName(planName);
    setCancelSuccess(false);
    setCancelError(null);
    setCancelPending(false);
  }

  function closeModal() {
    setPendingCancelId(null);
    setPendingCancelName(null);
    setCancelSuccess(false);
    setCancelError(null);
    setCancelPending(false);
  }

  async function handleCancelConfirm() {
    if (!actor || !pendingCancelId) return;
    setCancelPending(true);
    setCancelError(null);
    try {
      // Bug fix: use stripe_subscription_id (pendingCancelId), NOT String(subscription.id)
      const result: UpsertResult = await (
        actor as unknown as backendInterface
      ).submitCancellationRequest(pendingCancelId);
      if ("ok" in result || "okAlreadyAdvanced" in result) {
        setCancelSuccess(true);
        // Re-fetch to get updated statuses
        setRetryCount((c) => c + 1);
      } else if ("err" in result) {
        setCancelError(
          result.err ||
            "Could not submit cancellation request. Please try again.",
        );
      }
    } catch {
      setCancelError("An error occurred. Please try again.");
    } finally {
      setCancelPending(false);
    }
  }

  async function handleUpdatePaymentMethod() {
    if (!actor) return;
    setPortalLoading(true);
    setPortalError(null);
    try {
      const result = await (
        actor as unknown as backendInterface
      ).createStripePortalSession(userEmail);
      if ("ok" in result) {
        window.location.href = result.ok;
      } else {
        setPortalError(
          result.err || "Could not open payment portal. Please try again.",
        );
      }
    } catch {
      setPortalError("An error occurred. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  const activeSubs =
    subscriptions?.filter((s) => !isPastStatus(s.status)) ?? [];
  const pastSubs = subscriptions?.filter((s) => isPastStatus(s.status)) ?? [];

  const hasActiveSubs = activeSubs.length > 0;

  // Billing history: only show section if loading, errored, or has records
  const showBillingSection =
    billingLoading ||
    billingError !== null ||
    (billingHistory !== undefined && billingHistory.length > 0);

  return (
    <PortalLayout pageTitle="Subscriptions">
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes typewriter-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* ── Pending checkout banner ── */}
        {showPendingBanner && (
          <div
            data-ocid="subscriptions.pending_banner"
            role="alert"
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(94,240,138,0.09)",
              border: "1px solid rgba(94,240,138,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap" as const,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#5EF08A",
                lineHeight: 1.5,
                flex: 1,
              }}
            >
              Your order has been received. Your subscription will be activated
              shortly.
            </p>
            <button
              type="button"
              data-ocid="subscriptions.pending_banner.dismiss"
              aria-label="Dismiss pending notice"
              onClick={() => setShowPendingBanner(false)}
              style={{
                background: "none",
                border: "none",
                color: "#5EF08A",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                fontSize: "18px",
                lineHeight: 1,
                fontWeight: 700,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── Page toolbar: Update Payment Method button ── */}
        {hasActiveSubs && (
          <div
            data-ocid="subscriptions.toolbar.panel"
            style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
          >
            {portalError && (
              <p
                data-ocid="subscriptions.portal.error_state"
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#EF4444",
                  background: "rgba(239,68,68,0.1)",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "1px solid rgba(239,68,68,0.3)",
                  alignSelf: "center",
                }}
              >
                {portalError}
              </p>
            )}
            <button
              type="button"
              data-ocid="subscriptions.update_payment.button"
              onClick={handleUpdatePaymentMethod}
              disabled={portalLoading}
              className="matrix-btn-outline"
              style={{
                padding: "9px 18px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: portalLoading ? 0.7 : 1,
                cursor: portalLoading ? "not-allowed" : "pointer",
              }}
            >
              {portalLoading && (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-label="Loading"
                  role="img"
                  style={{ animation: "spin 0.8s linear infinite" }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="rgba(94,240,138,0.3)"
                    strokeWidth="3"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="#5EF08A"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {portalLoading ? "Opening..." : "Update Payment Method"}
            </button>
          </div>
        )}

        {/* ── Active Subscriptions ── */}
        <section data-ocid="subscriptions.active.section">
          <h3 style={{ margin: "0 0 16px" }}>
            <TypewriterText
              text="Active Subscriptions."
              className="matrix-heading"
              style={{ fontSize: "16px", fontWeight: 700 }}
              speed={40}
            />
          </h3>

          {isLoading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="matrix-card"
                  style={{ padding: "20px 24px" }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px 24px",
                    }}
                  >
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j}>
                        <Skeleton
                          style={{
                            height: "12px",
                            width: "60px",
                            marginBottom: "8px",
                          }}
                        />
                        <Skeleton style={{ height: "18px", width: "120px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div
              data-ocid="subscriptions.error_state"
              className="matrix-card"
              style={{
                padding: "20px 24px",
                border: "1px solid rgba(239,68,68,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <p style={{ margin: 0, color: "#EF4444", fontSize: "14px" }}>
                <EditableText
                  textKey="portal.subscriptions.error-state"
                  defaultText="Could not load subscription data. Please try again."
                  as="span"
                />
              </p>
              <button
                type="button"
                data-ocid="subscriptions.retry_button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="matrix-btn-outline"
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                Retry
              </button>
            </div>
          ) : activeSubs.length === 0 ? (
            <div
              data-ocid="subscriptions.active.empty_state"
              className="text-center py-12 border border-slate-200 rounded-lg bg-slate-50"
            >
              <p className="text-slate-500 text-lg">No active subscriptions</p>
              <a
                href="/services"
                className="text-green-600 hover:underline mt-4 inline-block font-medium"
              >
                Browse services →
              </a>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {activeSubs.map((sub, idx) => (
                <SubscriptionRow
                  key={String(sub.id)}
                  sub={sub}
                  index={idx}
                  onRequestCancel={openCancelModal}
                  showCancel
                  onUpdatePayment={handleUpdatePaymentMethod}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Past Subscriptions — only rendered if there are any ── */}
        {!isLoading && !loadError && pastSubs.length > 0 && (
          <section data-ocid="subscriptions.past.section">
            <h3 style={{ margin: "0 0 16px" }}>
              <TypewriterText
                text="Past Subscriptions."
                className="matrix-heading"
                style={{ fontSize: "16px", fontWeight: 700 }}
                speed={40}
              />
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {pastSubs.map((sub, idx) => {
                const subKey = String(sub.id);
                const isCancelled =
                  sub.status.toLowerCase() === "cancelled" ||
                  sub.status.toLowerCase() === "canceled";
                const thirtyDaysAgo =
                  BigInt(Date.now() - 30 * 24 * 60 * 60 * 1000) * 1_000_000n;
                const withinThirtyDays =
                  sub.updated_at > 0n && sub.updated_at >= thirtyDaysAgo;
                const showBanner =
                  isCancelled &&
                  withinThirtyDays &&
                  !dismissedCancelBanners.has(subKey);
                return (
                  <div
                    key={subKey}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {showBanner && (
                      <div
                        data-ocid={`subscriptions.cancelled_banner.${idx + 1}`}
                        role="alert"
                        style={{
                          padding: "12px 16px",
                          borderRadius: "8px",
                          background: "rgba(234,179,8,0.09)",
                          border: "1px solid rgba(234,179,8,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap" as const,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "#EAB308",
                            lineHeight: 1.5,
                            flex: 1,
                          }}
                        >
                          This subscription was cancelled. If this was a
                          mistake, please{" "}
                          <a
                            href="/portal/messages"
                            style={{
                              color: "#EAB308",
                              textDecoration: "underline",
                            }}
                          >
                            contact us
                          </a>
                          .
                        </p>
                        <button
                          type="button"
                          data-ocid={`subscriptions.cancelled_banner.dismiss.${idx + 1}`}
                          aria-label="Dismiss cancellation notice"
                          onClick={() => dismissCancelBanner(subKey)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#EAB308",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                            fontSize: "18px",
                            lineHeight: 1,
                            fontWeight: 700,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <SubscriptionRow
                      sub={sub}
                      index={idx}
                      onRequestCancel={openCancelModal}
                      showCancel={false}
                      onUpdatePayment={handleUpdatePaymentMethod}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Billing History — only show section when loading, errored, or has records ── */}
        {showBillingSection && (
          <section data-ocid="subscriptions.billing_history.section">
            <h3 style={{ margin: "0 0 16px" }}>
              <TypewriterText
                text="Billing History."
                className="matrix-heading"
                style={{ fontSize: "16px", fontWeight: 700 }}
                speed={40}
              />
            </h3>

            {billingLoading ? (
              <div
                data-ocid="subscriptions.billing_history.loading_state"
                className="matrix-card"
                style={{ padding: "20px 24px" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                  }}
                >
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} style={{ height: "16px" }} />
                  ))}
                </div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "12px",
                      marginTop: "12px",
                    }}
                  >
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} style={{ height: "14px" }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : billingError !== null ? (
              <div
                data-ocid="subscriptions.billing_history.error_state"
                className="matrix-card"
                style={{
                  padding: "20px 24px",
                  border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#EF4444",
                    fontSize: "14px",
                    flex: 1,
                  }}
                >
                  {billingError}
                </p>
              </div>
            ) : billingHistory && billingHistory.length > 0 ? (
              <div className="matrix-card" style={{ overflow: "hidden" }}>
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.4fr 0.8fr 0.8fr",
                    gap: "0 12px",
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(94,240,138,0.12)",
                    background: "rgba(94,240,138,0.04)",
                  }}
                >
                  {["Date", "Service", "Amount", "Status"].map((h) => (
                    <span
                      key={h}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#5EF08A",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                        fontFamily: "monospace",
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {/* Table rows */}
                {billingHistory.map((record, idx) => (
                  <div
                    key={String(record.id)}
                    data-ocid={`subscriptions.billing_history.item.${idx + 1}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.4fr 0.8fr 0.8fr",
                      gap: "0 12px",
                      padding: "14px 20px",
                      borderBottom:
                        idx < billingHistory.length - 1
                          ? "1px solid rgba(94,240,138,0.07)"
                          : "none",
                      alignItems: "center",
                      animation: "typewriter-fade-in 0.3s ease forwards",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#7A7D90",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatBillingDate(record.payment_date)}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#EEF0F8",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {record.description || "Subscription"}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#EEF0F8",
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    >
                      {formatAmount(record.amount)}
                    </span>
                    <BillingBadge status={record.status} />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )}
      </div>

      {/* ── Cancellation Confirmation Modal ── */}
      {pendingCancelId !== null && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeModal}
            onKeyUp={(e) => {
              if (e.key === "Escape") closeModal();
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 100,
            }}
          />
          <dialog
            data-ocid="subscriptions.cancel.dialog"
            open
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 101,
              background: "#0A0B14",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "480px",
              width: "calc(100% - 48px)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(94,240,138,0.1)",
              border: "1px solid rgba(94,240,138,0.25)",
              margin: 0,
            }}
          >
            {cancelSuccess ? (
              <div data-ocid="subscriptions.cancel.success_state">
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(94,240,138,0.1)",
                    border: "1px solid rgba(94,240,138,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-label="Success"
                    role="img"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#5EF08A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 style={{ margin: "0 0 12px" }}>
                  <TypewriterText
                    text="Cancellation Request Submitted"
                    className="matrix-heading"
                    style={{ fontSize: "17px", fontWeight: 700 }}
                    speed={35}
                  />
                </h3>
                <p
                  style={{
                    margin: "0 0 24px",
                    fontSize: "14px",
                    color: "#7A7D90",
                    lineHeight: 1.6,
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.cancel.success.body"
                    defaultText="Your cancellation request has been submitted. We will confirm via email within 24 hours."
                    as="span"
                  />
                </p>
                <button
                  type="button"
                  data-ocid="subscriptions.cancel.close_button"
                  onClick={closeModal}
                  className="matrix-btn"
                  style={{ width: "100%", padding: "11px" }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 id="cancel-modal-title" style={{ margin: "0 0 12px" }}>
                  <TypewriterText
                    text="Request Cancellation?"
                    className="matrix-heading"
                    style={{ fontSize: "17px", fontWeight: 700 }}
                    speed={35}
                  />
                </h3>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "14px",
                    color: "#7A7D90",
                    lineHeight: 1.7,
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.cancel.modal.body"
                    defaultText="Are you sure you want to request cancellation of"
                    as="span"
                  />
                  {pendingCancelName && (
                    <strong style={{ color: "#EEF0F8" }}>
                      {" "}
                      {pendingCancelName}
                    </strong>
                  )}
                  {
                    "? Your service will remain active through your final paid period."
                  }
                </p>

                {cancelError && (
                  <p
                    data-ocid="subscriptions.cancel.error_state"
                    style={{
                      margin: "0 0 16px",
                      fontSize: "13px",
                      color: "#EF4444",
                      background: "rgba(239,68,68,0.1)",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    {cancelError}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="button"
                    data-ocid="subscriptions.cancel.cancel_button"
                    onClick={closeModal}
                    disabled={cancelPending}
                    className="matrix-btn"
                    style={{
                      padding: "11px",
                      opacity: cancelPending ? 0.6 : 1,
                    }}
                  >
                    Keep My Plan
                  </button>
                  <button
                    type="button"
                    data-ocid="subscriptions.cancel.confirm_button"
                    onClick={handleCancelConfirm}
                    disabled={cancelPending}
                    style={{
                      padding: "11px",
                      borderRadius: "8px",
                      background: "rgba(239,68,68,0.15)",
                      color: "#EF4444",
                      fontWeight: 700,
                      fontSize: "14px",
                      border: "1px solid rgba(239,68,68,0.4)",
                      cursor: cancelPending ? "not-allowed" : "pointer",
                      opacity: cancelPending ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {cancelPending && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-label="Loading"
                        role="img"
                        style={{ animation: "spin 0.8s linear infinite" }}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="rgba(239,68,68,0.3)"
                          strokeWidth="3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="#EF4444"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {cancelPending
                      ? "Submitting..."
                      : "Submit Cancellation Request"}
                  </button>
                </div>
              </>
            )}
          </dialog>
        </>
      )}
    </PortalLayout>
  );
}
