import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Subscription, backendInterface } from "../../backend";
import { EditableText } from "../../components/EditableText";
import { useActor } from "../../hooks/useActor";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(40,45,70,0.8)",
        borderRadius: "6px",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Status badge configs
// ---------------------------------------------------------------------------
const SUB_STATUS: Record<string, { label: string; color: string; bg: string }> =
  {
    ACTIVE: { label: "ACTIVE", color: "#ffffff", bg: "#166534" },
    PAUSED: { label: "PAUSED", color: "#ffffff", bg: "#6B7280" },
    CANCELLED: { label: "CANCELLED", color: "#ffffff", bg: "#991B1B" },
  };

const BILLING_STATUS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PAID: { label: "PAID", color: "#166534", bg: "#DCFCE7" },
  FAILED: { label: "FAILED", color: "#991B1B", bg: "#FEE2E2" },
  PENDING: { label: "PENDING", color: "#92400e", bg: "#FEF9C3" },
};

function SubBadge({ status }: { status: string }) {
  const cfg = SUB_STATUS[status.toUpperCase()] ?? {
    label: status.toUpperCase(),
    color: "#7A7D90",
    bg: "#F3F4F6",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

function BillingBadge({ status }: { status: string }) {
  const cfg = BILLING_STATUS[status.toUpperCase()] ?? {
    label: status.toUpperCase(),
    color: "#7A7D90",
    bg: "#F3F4F6",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PortalSubscriptionsPage() {
  const { actor, isFetching } = useActor();

  const [subscription, setSubscription] = useState<
    Subscription | null | undefined
  >(undefined);
  const [billingHistory, setBillingHistory] = useState<any[] | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState(false);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    async function load() {
      try {
        const [sub, billing] = await Promise.all([
          actor!.getMySubscriptions(),
          (actor as backendInterface).getMyBillingHistory(),
        ]);
        if (!cancelled) {
          setSubscription(Array.isArray(sub) ? (sub[0] ?? null) : sub);
          setBillingHistory(billing);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const isLoading =
    isFetching ||
    (subscription === undefined && billingHistory === undefined && !loadError);

  async function handleCancelSubmit() {
    if (!actor || !subscription) return;
    setCancelPending(true);
    setCancelError("");
    try {
      const result = await (
        actor as backendInterface
      ).submitCancellationRequest(String(subscription.id));
      if ("ok" in result) {
        setCancelSuccess(true);
      } else {
        setCancelError(
          "Could not submit cancellation request. Please try again.",
        );
      }
    } catch {
      setCancelError("An error occurred. Please try again.");
    } finally {
      setCancelPending(false);
    }
  }

  function closeModal() {
    setShowCancelModal(false);
    setCancelSuccess(false);
    setCancelError("");
    setCancelPending(false);
  }

  return (
    <PortalLayout pageTitle="Subscriptions">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sub-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        @media (max-width: 640px) {
          .billing-table-desktop { display: none !important; }
          .billing-blocks-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .billing-table-desktop { display: table !important; }
          .billing-blocks-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ===== ACTIVE SUBSCRIPTION CARD ===== */}
        {isLoading ? (
          <div
            style={{
              background: "rgba(17,19,34,0.7)",
              borderRadius: "8px",
              padding: "24px",
              border: "1px solid #1C1F33",
            }}
          >
            <Skeleton
              style={{ height: "20px", width: "160px", marginBottom: "24px" }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton
                    style={{
                      height: "12px",
                      width: "60px",
                      marginBottom: "8px",
                    }}
                  />
                  <Skeleton style={{ height: "20px", width: "120px" }} />
                </div>
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div
            data-ocid="subscriptions.error_state"
            style={{
              background: "#FEE2E2",
              borderRadius: "8px",
              padding: "24px",
              border: "1px solid #1C1F33",
              color: "#991B1B",
              fontSize: "14px",
            }}
          >
            <EditableText
              textKey="portal.subscriptions.error-state"
              defaultText="Could not load subscription data. Please refresh."
              as="span"
            />
          </div>
        ) : !subscription ? (
          /* Empty state */
          <div
            data-ocid="subscriptions.empty_state"
            style={{
              background: "rgba(17,19,34,0.7)",
              borderRadius: "8px",
              padding: "48px 24px",
              border: "1px solid #1C1F33",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: "0 0 20px",
                fontSize: "15px",
                color: "#7A7D90",
              }}
            >
              <EditableText
                textKey="portal.subscriptions.empty-state"
                defaultText="No active subscription yet. Every build requires a maintenance plan."
                as="span"
              />
            </p>
            <Link
              to="/services"
              hash="plans"
              data-ocid="subscriptions.view_plans.button"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                borderRadius: "8px",
                background: "#5EF08A",
                color: "#061209",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              <EditableText
                textKey="portal.subscriptions.view-plans-button"
                defaultText="View Plans"
                as="span"
              />
            </Link>
          </div>
        ) : (
          /* Active subscription card */
          <div
            data-ocid="subscriptions.card"
            style={{
              background: "rgba(17,19,34,0.7)",
              borderRadius: "8px",
              padding: "24px",
              border: "1px solid #1C1F33",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#EEF0F8",
              }}
            >
              <EditableText
                textKey="portal.subscriptions.current-plan.heading"
                defaultText="Your Current Plan."
                as="span"
              />
            </h3>

            {/* 2x2 data grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ gap: "20px", marginBottom: "24px" }}
            >
              {/* Plan Name */}
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.plan-name.label"
                    defaultText="Plan Name"
                    as="span"
                  />
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  {subscription.plan_name}
                </p>
              </div>

              {/* Status */}
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.status.label"
                    defaultText="Status"
                    as="span"
                  />
                </p>
                <SubBadge status={subscription.status} />
              </div>

              {/* Billing Cycle */}
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.billing-cycle.label"
                    defaultText="Billing Cycle"
                    as="span"
                  />
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  {subscription.billing_cycle}
                </p>
              </div>

              {/* Next Payment Date */}
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: "12px",
                    color: "#7A7D90",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.next-payment.label"
                    defaultText="Next Payment Date"
                    as="span"
                  />
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  {formatDate(subscription.next_payment_date)}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/services"
                hash="plans"
                data-ocid="subscriptions.switch_plan.button"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "rgba(17,19,34,0.7)",
                  color: "#EEF0F8",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  border: "1.5px solid #1C1F33",
                  cursor: "pointer",
                }}
              >
                <EditableText
                  textKey="portal.subscriptions.switch-plan.button"
                  defaultText="Switch Plan"
                  as="span"
                />
              </Link>
              <button
                type="button"
                data-ocid="subscriptions.cancel.button"
                onClick={() => setShowCancelModal(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "rgba(17,19,34,0.7)",
                  color: "#991B1B",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "1.5px solid #991B1B",
                  cursor: "pointer",
                }}
              >
                <EditableText
                  textKey="portal.subscriptions.cancel.button"
                  defaultText="Cancel Subscription"
                  as="span"
                />
              </button>
            </div>
          </div>
        )}

        {/* ===== BILLING HISTORY ===== */}
        <div
          style={{
            background: "rgba(17,19,34,0.7)",
            borderRadius: "8px",
            padding: "24px",
            border: "1px solid #1C1F33",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            <EditableText
              textKey="portal.subscriptions.billing-history.heading"
              defaultText="Billing History."
              as="span"
            />
          </h3>

          {isLoading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ height: "44px", width: "100%" }} />
              ))}
            </div>
          ) : !billingHistory || billingHistory.length === 0 ? (
            <p
              data-ocid="subscriptions.billing_history.empty_state"
              style={{ color: "#7A7D90", fontSize: "14px", margin: 0 }}
            >
              <EditableText
                textKey="portal.subscriptions.billing-history.empty-state"
                defaultText="No billing history yet."
                as="span"
              />
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div style={{ overflowX: "auto" }}>
                <table
                  data-ocid="subscriptions.billing_history.table"
                  className="billing-table-desktop"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "540px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#0A0B14",
                        borderBottom: "1px solid #1C1F33",
                      }}
                    >
                      {["Date", "Description", "Amount", "Status"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#7A7D90",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((record, idx) => (
                      <tr
                        key={String(record.id)}
                        data-ocid={`subscriptions.billing_history.row.${idx + 1}`}
                        style={{
                          background:
                            idx % 2 === 0
                              ? "rgba(17,19,34,0.7)"
                              : "rgba(14,16,32,0.9)",
                          borderBottom: "1px solid #1C1F33",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "14px",
                            color: "#7A7D90",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(record.payment_date)}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "14px",
                            color: "#EEF0F8",
                          }}
                        >
                          {record.description}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#EEF0F8",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatAmount(record.amount)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <BillingBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile stacked blocks */}
              <div
                className="billing-blocks-mobile"
                style={{ flexDirection: "column", gap: "12px" }}
              >
                {billingHistory.map((record, idx) => (
                  <div
                    key={String(record.id)}
                    data-ocid={`subscriptions.billing_history.row.${idx + 1}`}
                    style={{
                      background:
                        idx % 2 === 0
                          ? "rgba(17,19,34,0.7)"
                          : "rgba(14,16,32,0.9)",
                      borderRadius: "8px",
                      border: "1px solid #1C1F33",
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontSize: "11px",
                          color: "#7A7D90",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Date
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#7A7D90",
                        }}
                      >
                        {formatDate(record.payment_date)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontSize: "11px",
                          color: "#7A7D90",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Status
                      </p>
                      <BillingBadge status={record.status} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontSize: "11px",
                          color: "#7A7D90",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Description
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#EEF0F8",
                        }}
                      >
                        {record.description}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontSize: "11px",
                          color: "#7A7D90",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Amount
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#EEF0F8",
                        }}
                      >
                        {formatAmount(record.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== CANCEL MODAL ===== */}
      {showCancelModal && (
        <>
          {/* Backdrop: click to dismiss */}
          <div
            className="sub-modal-backdrop"
            aria-hidden="true"
            onClick={closeModal}
            onKeyUp={(e) => {
              if (e.key === "Escape") closeModal();
            }}
          />
          <dialog
            data-ocid="subscriptions.cancel.modal"
            open
            aria-labelledby="cancel-modal-title"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 101,
              background: "rgba(17,19,34,0.7)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "480px",
              width: "calc(100% - 48px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              border: "none",
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
                    background: "#DCFCE7",
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
                    aria-label="Success checkmark"
                    role="img"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#166534"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.cancel.success.heading"
                    defaultText="Cancellation Request Submitted"
                    as="span"
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
                  onClick={closeModal}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "8px",
                    background: "#5EF08A",
                    color: "#061209",
                    fontWeight: 700,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.cancel.success.close-button"
                    defaultText="Close"
                    as="span"
                  />
                </button>
              </div>
            ) : (
              <>
                <h3
                  id="cancel-modal-title"
                  style={{
                    margin: "0 0 12px",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#EEF0F8",
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.cancel.modal.heading"
                    defaultText="Cancel Your Subscription?"
                    as="span"
                  />
                </h3>
                <p
                  style={{
                    margin: "0 0 24px",
                    fontSize: "14px",
                    color: "#7A7D90",
                    lineHeight: 1.7,
                  }}
                >
                  <EditableText
                    textKey="portal.subscriptions.cancel.modal.body"
                    defaultText="Are you sure you want to cancel? Your site will remain live through your final paid period. This action requires 30 days written notice — cancellation is not immediate."
                    as="span"
                  />
                </p>

                {cancelError && (
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: "13px",
                      color: "#991B1B",
                      background: "#FEE2E2",
                      padding: "10px 14px",
                      borderRadius: "6px",
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
                  }}
                >
                  <button
                    type="button"
                    data-ocid="subscriptions.cancel.cancel_button"
                    onClick={closeModal}
                    disabled={cancelPending}
                    style={{
                      padding: "11px",
                      borderRadius: "8px",
                      background: "#5EF08A",
                      color: "#061209",
                      fontWeight: 700,
                      fontSize: "14px",
                      border: "none",
                      cursor: cancelPending ? "not-allowed" : "pointer",
                      opacity: cancelPending ? 0.6 : 1,
                    }}
                  >
                    <EditableText
                      textKey="portal.subscriptions.cancel.keep-plan.button"
                      defaultText="Keep My Plan"
                      as="span"
                    />
                  </button>
                  <button
                    type="button"
                    data-ocid="subscriptions.cancel.confirm_button"
                    onClick={handleCancelSubmit}
                    disabled={cancelPending}
                    style={{
                      padding: "11px",
                      borderRadius: "8px",
                      background: cancelPending ? "#F87171" : "#991B1B",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "14px",
                      border: "none",
                      cursor: cancelPending ? "not-allowed" : "pointer",
                      opacity: cancelPending ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {cancelPending ? (
                      <>
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
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="3"
                          />
                          <path
                            d="M12 2a10 10 0 0 1 10 10"
                            stroke="#ffffff"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <EditableText
                        textKey="portal.subscriptions.cancel.confirm.button"
                        defaultText="Submit Cancellation Request"
                        as="span"
                      />
                    )}
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
