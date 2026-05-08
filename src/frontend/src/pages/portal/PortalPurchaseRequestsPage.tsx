import { ClipboardList, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  PurchaseRequest as BackendPurchaseRequest,
  backendInterface,
} from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PurchaseRequest {
  id: string;
  clientEmail: string;
  productId: string;
  productName: string;
  amount: number;
  frequency: string;
  status: "pending" | "approved" | "declined";
  requestedAt: bigint;
  declineReason?: string;
  checkoutUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatFreq(f: string): string {
  if (f === "one-time") return "One-time";
  if (f === "monthly") return "per month";
  if (f === "annual") return "per year";
  return f;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PurchaseRequest["status"] }) {
  const styles: Record<
    PurchaseRequest["status"],
    { bg: string; border: string; color: string; label: string }
  > = {
    pending: {
      bg: "rgba(251,146,60,0.1)",
      border: "rgba(251,146,60,0.35)",
      color: "#FB923C",
      label: "Pending",
    },
    approved: {
      bg: "rgba(94,240,138,0.1)",
      border: "rgba(94,240,138,0.35)",
      color: "#5EF08A",
      label: "Approved",
    },
    declined: {
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.35)",
      color: "#EF4444",
      label: "Declined",
    },
  };
  const s = styles[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "20px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------
function RequestCard({
  request,
  index,
}: {
  request: PurchaseRequest;
  index: number;
}) {
  return (
    <div
      data-ocid={`requests.item.${index + 1}`}
      style={{
        background: "rgba(17,19,34,0.8)",
        border: "1px solid #1C1F33",
        borderRadius: "14px",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: "16px",
              fontWeight: 700,
              color: "#EEF0F8",
              lineHeight: "1.3",
            }}
          >
            {request.productName}
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#7A7D90" }}>
            Submitted {formatDate(request.requestedAt)}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Amount row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#5EF08A" }}>
          {formatPrice(request.amount)}
        </span>
        <span style={{ fontSize: "13px", color: "#7A7D90" }}>
          {formatFreq(request.frequency)}
        </span>
      </div>

      {/* Status-specific content */}
      {request.status === "pending" && (
        <div
          data-ocid={`requests.loading_state.${index + 1}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#7A7D90",
            fontSize: "13px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#FB923C",
              flexShrink: 0,
              animation: "pendingPulse 1.8s ease-in-out infinite",
            }}
          />
          Pending admin review
        </div>
      )}

      {request.status === "approved" && request.checkoutUrl && (
        <a
          href={request.checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-ocid={`requests.checkout_button.${index + 1}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 18px",
            minHeight: "44px",
            color: "#061209",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
            alignSelf: "flex-start",
            transition: "background 0.15s",
          }}
        >
          <ExternalLink size={14} />
          Checkout
        </a>
      )}

      {request.status === "approved" && !request.checkoutUrl && (
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#5EF08A",
            opacity: 0.8,
          }}
        >
          Approved — invoice will be sent to your email shortly.
        </p>
      )}

      {request.status === "declined" && request.declineReason && (
        <p
          data-ocid={`requests.decline_reason.${index + 1}`}
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#7A7D90",
            lineHeight: "1.6",
            fontStyle: "italic",
          }}
        >
          Reason: {request.declineReason}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(17,19,34,0.8)",
        border: "1px solid #1C1F33",
        borderRadius: "14px",
        padding: "22px 24px",
        height: "140px",
        backgroundImage:
          "linear-gradient(90deg, rgba(40,45,70,0.4) 25%, rgba(60,65,90,0.4) 50%, rgba(40,45,70,0.4) 75%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.5s infinite linear",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PortalPurchaseRequestsPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching || !userEmail) return;
    let cancelled = false;

    async function load() {
      try {
        const result = await (
          actor as backendInterface
        ).getClientPurchaseRequests(userEmail);
        if (!cancelled) {
          const raw: PurchaseRequest[] = (
            Array.isArray(result) ? result : []
          ).map((r: BackendPurchaseRequest) => ({
            id: String(r.id),
            clientEmail: r.clientEmail,
            productId: String(r.productId),
            productName: r.productName,
            amount: r.amount,
            frequency: r.frequency,
            status: r.status as "pending" | "approved" | "declined",
            requestedAt: r.requestedAt,
            declineReason: r.declineReason ?? undefined,
            checkoutUrl: r.checkoutUrl ?? undefined,
          }));
          // Sort newest first by requestedAt
          raw.sort(
            (a: PurchaseRequest, b: PurchaseRequest) =>
              Number(b.requestedAt) - Number(a.requestedAt),
          );
          setRequests(raw);
        }
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, userEmail]);

  return (
    <PortalLayout pageTitle="Purchase Requests">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes pendingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div
        data-ocid="requests.page"
        style={{
          maxWidth: "720px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <div data-ocid="requests.section">
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#EEF0F8",
            }}
          >
            Purchase Requests
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#7A7D90" }}>
            Track the status of your purchase requests. Approved requests
            include a checkout link.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div
            data-ocid="requests.loading_state"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#7A7D90",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              <Loader2
                size={15}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              Loading requests…
            </div>
            {[1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && requests.length === 0 && (
          <div
            data-ocid="requests.empty_state"
            style={{
              background: "rgba(17,19,34,0.7)",
              border: "1px solid #1C1F33",
              borderRadius: "14px",
              padding: "56px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(94,240,138,0.08)",
                border: "1px solid rgba(94,240,138,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <ClipboardList
                size={26}
                style={{ color: "rgba(94,240,138,0.5)" }}
              />
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#EEF0F8",
              }}
            >
              No requests yet
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#7A7D90",
                maxWidth: "340px",
                marginInline: "auto",
                lineHeight: "1.6",
              }}
            >
              You have not submitted any purchase requests yet. Browse the Shop
              tab to get started.
            </p>
          </div>
        )}

        {/* Request list */}
        {!loading && requests.length > 0 && (
          <div
            data-ocid="requests.list"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {requests.map((req, idx) => (
              <RequestCard key={req.id} request={req} index={idx} />
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
