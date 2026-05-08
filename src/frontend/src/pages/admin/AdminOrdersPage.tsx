import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Download, Eye } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { getSession } from "../../hooks/useSession";
import AdminLayout from "./AdminLayout";

function getAdminEmail(): string {
  const s = getSession();
  return s?.email ?? localStorage.getItem("imperidome_admin_email") ?? "";
}

// ─── Order Types ────────────────────────────────────────────────────────────

type StatusKey =
  | "questionnairePending"
  | "questionnaireComplete"
  | "depositSent"
  | "depositReceived"
  | "buildInProgress"
  | "draftReady"
  | "revisionsInProgress"
  | "launching"
  | "live"
  | "paused"
  | "cancelled";

type OrderFilterOption = "all" | "active" | "live" | "paused" | "cancelled";
type TransactionTab = "one-time" | "subscriptions" | "health";

// ─── Stripe Data Types ───────────────────────────────────────────────────────

interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "failed" | "pending";
  created: number;
  failure_message?: string | null;
  refunded?: boolean;
  customer?: string | null;
  billing_details?: {
    name?: string | null;
    email?: string | null;
  };
  metadata?: Record<string, string>;
}

interface StripeSubscriptionItem {
  price?: {
    nickname?: string | null;
    product?: string | { name?: string } | null;
  };
}

interface StripeSubscription {
  id: string;
  status:
    | "active"
    | "past_due"
    | "unpaid"
    | "canceled"
    | "trialing"
    | "incomplete";
  current_period_end: number;
  customer?: string | null;
  items?: {
    data?: StripeSubscriptionItem[];
  };
  metadata?: Record<string, string>;
}

interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "in_transit" | "canceled" | "failed";
  arrival_date: number;
}

interface StripeCustomer {
  id: string;
  email?: string | null;
  name?: string | null;
}

interface StripeChargesResponse {
  data?: StripeCharge[];
  object?: string;
}

interface StripeSubscriptionsResponse {
  data?: StripeSubscription[];
  object?: string;
}

interface StripePayoutsResponse {
  data?: StripePayout[];
  object?: string;
}

interface StripeCustomersResponse {
  data?: StripeCustomer[];
  object?: string;
}

interface StripeData {
  charges: StripeCharge[];
  subscriptions: StripeSubscription[];
  payouts: StripePayout[];
  customers: StripeCustomer[];
  monthlyRevenue: number;
  pendingPayouts: number;
  customerCount: number;
}

// ─── Order Constants ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<StatusKey, string> = {
  questionnairePending: "QUESTIONNAIRE PENDING",
  questionnaireComplete: "QUESTIONNAIRE COMPLETE",
  depositSent: "DEPOSIT SENT",
  depositReceived: "DEPOSIT RECEIVED",
  buildInProgress: "BUILD IN PROGRESS",
  draftReady: "DRAFT READY",
  revisionsInProgress: "REVISIONS IN PROGRESS",
  launching: "LAUNCHING",
  live: "LIVE",
  paused: "PAUSED",
  cancelled: "CANCELLED",
};

const STATUS_COLORS: Record<StatusKey, { bg: string; text: string }> = {
  questionnairePending: { bg: "rgba(250,204,21,0.15)", text: "#fbbf24" },
  questionnaireComplete: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  depositSent: { bg: "rgba(249,115,22,0.15)", text: "#fb923c" },
  depositReceived: { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" },
  buildInProgress: { bg: "rgba(99,102,241,0.15)", text: "#a5b4fc" },
  draftReady: { bg: "rgba(168,85,247,0.15)", text: "#c084fc" },
  revisionsInProgress: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  launching: { bg: "rgba(20,184,166,0.15)", text: "#2dd4bf" },
  live: { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" },
  paused: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
  cancelled: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

const EMAIL_TRIGGER_STATUSES: StatusKey[] = [
  "depositSent",
  "depositReceived",
  "draftReady",
  "revisionsInProgress",
  "launching",
  "live",
];

const ALL_STATUS_KEYS: StatusKey[] = [
  "questionnairePending",
  "questionnaireComplete",
  "depositSent",
  "depositReceived",
  "buildInProgress",
  "draftReady",
  "revisionsInProgress",
  "launching",
  "live",
  "paused",
  "cancelled",
];

const NON_ACTIVE_STATUSES: StatusKey[] = ["live", "paused", "cancelled"];

// ─── Order Interfaces ────────────────────────────────────────────────────────

interface Order {
  id: bigint;
  client_id: { toString?: () => string };
  tier_code: string;
  status: Record<string, null>;
  delivery_window: string;
  launch_target: string;
  created_at: bigint;
  updated_at: bigint;
}

interface ClientInfo {
  name: string;
  email: string;
  businessName: string;
  principalStr: string;
}

interface ClientSummary {
  profile: {
    principal: { toString?: () => string };
    firstName: string;
    lastName: string;
    email: string;
    businessName: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function getStatusKey(status: Record<string, null>): StatusKey {
  return Object.keys(status)[0] as StatusKey;
}

function makeStatus(key: StatusKey): Record<string, null> {
  return { [key]: null };
}

function tsToDate(ns: bigint): Date {
  return new Date(Number(ns) / 1_000_000);
}

function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function formatDate(ts: bigint): string {
  return tsToDate(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUnixDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exportOrdersCSV(
  orders: Order[],
  clientInfoMap: Map<string, ClientInfo>,
) {
  const headers = [
    "Order ID",
    "Client Name",
    "Business Name",
    "Tier",
    "Status",
    "Delivery Window",
    "Launch Target",
    "Created",
  ];
  const csvEscape = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
  const lines = orders.map((o) => {
    const clientIdStr = o.client_id?.toString?.() ?? "";
    const info = clientInfoMap.get(clientIdStr);
    const clientName = info?.name ?? "Unknown";
    const businessName = info?.businessName ?? "";
    const statusKey = getStatusKey(o.status);
    const statusLabel = STATUS_LABELS[statusKey] ?? statusKey;
    return [
      csvEscape(o.id.toString()),
      csvEscape(clientName),
      csvEscape(businessName),
      csvEscape(o.tier_code),
      csvEscape(statusLabel),
      csvEscape(o.delivery_window),
      csvEscape(o.launch_target),
      csvEscape(formatDate(o.created_at)),
    ].join(",");
  });
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `imperidome-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function safeParseStripe<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function getSubscriptionPlanName(sub: StripeSubscription): string {
  const item = sub.items?.data?.[0];
  if (!item?.price) return "—";
  const nickname = item.price.nickname;
  if (nickname) return nickname;
  const product = item.price.product;
  if (typeof product === "object" && product !== null && "name" in product) {
    return (product as { name?: string }).name ?? "—";
  }
  return "—";
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StatusBadge({ statusKey }: { statusKey: StatusKey }) {
  const colors = STATUS_COLORS[statusKey] ?? {
    bg: "rgba(122,125,144,0.15)",
    text: "#7A7D90",
  };
  const label = STATUS_LABELS[statusKey] ?? statusKey;
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: 4,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

function StripeBadge({
  status,
}: {
  status: string;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    succeeded: { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" },
    active: { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" },
    paid: { bg: "rgba(94,240,138,0.15)", text: "#5EF08A" },
    trialing: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
    pending: { bg: "rgba(250,204,21,0.15)", text: "#fbbf24" },
    in_transit: { bg: "rgba(250,204,21,0.15)", text: "#fbbf24" },
    past_due: { bg: "rgba(249,115,22,0.15)", text: "#fb923c" },
    unpaid: { bg: "rgba(249,115,22,0.15)", text: "#fb923c" },
    incomplete: { bg: "rgba(249,115,22,0.15)", text: "#fb923c" },
    failed: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
    canceled: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
    refunded: { bg: "rgba(168,85,247,0.15)", text: "#c084fc" },
  };
  const colors = colorMap[status] ?? {
    bg: "rgba(122,125,144,0.15)",
    text: "#7A7D90",
  };
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: 4,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        display: "inline-block",
        textTransform: "uppercase",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function UnavailableNote({ message }: { message: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "32px 0",
        color: "#7A7D90",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}

function StripeLoadingRow() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {["a", "b", "c"].map((k) => (
        <Skeleton
          key={k}
          style={{
            height: 18,
            width: "100%",
            background: "rgba(255,255,255,0.04)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Transaction Tab: One-Time Payments ──────────────────────────────────────

function OneTimePaymentsTab({
  charges,
  loading,
  unavailable,
  unavailableMessage,
  searchQuery,
}: {
  charges: StripeCharge[];
  loading: boolean;
  unavailable: boolean;
  unavailableMessage: string;
  searchQuery: string;
}) {
  if (loading) return <StripeLoadingRow />;
  if (unavailable) {
    return <UnavailableNote message={unavailableMessage} />;
  }

  const q = searchQuery.trim().toLowerCase();
  const filtered = charges.filter((c) => {
    if (!q) return true;
    const name = (c.billing_details?.name ?? "").toLowerCase();
    const email = (c.billing_details?.email ?? "").toLowerCase();
    const meta = Object.values(c.metadata ?? {})
      .join(" ")
      .toLowerCase();
    return name.includes(q) || email.includes(q) || meta.includes(q);
  });

  if (filtered.length === 0) {
    return (
      <UnavailableNote message="No one-time payments in the last 90 days." />
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}
      >
        <thead>
          <tr>
            {["Customer", "Amount", "Date", "Status"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#7A7D90",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #1C1F33",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((charge) => (
            <tr
              key={charge.id}
              style={{ borderTop: "1px solid rgba(28,31,51,0.6)" }}
            >
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <div
                  style={{ fontSize: 13, color: "#EEF0F8", fontWeight: 600 }}
                >
                  {charge.billing_details?.name || charge.customer || "—"}
                </div>
                {charge.billing_details?.email && (
                  <div style={{ fontSize: 11, color: "#7A7D90", marginTop: 1 }}>
                    {charge.billing_details.email}
                  </div>
                )}
              </td>
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#EEF0F8",
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                >
                  {formatCents(charge.amount)}
                </span>
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  verticalAlign: "middle",
                  color: "#7A7D90",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {formatUnixDate(charge.created)}
              </td>
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <StripeBadge
                  status={charge.refunded ? "refunded" : charge.status}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Transaction Tab: Subscriptions ─────────────────────────────────────────

function SubscriptionsTab({
  subscriptions,
  loading,
  unavailable,
  unavailableMessage,
  searchQuery,
}: {
  subscriptions: StripeSubscription[];
  loading: boolean;
  unavailable: boolean;
  unavailableMessage: string;
  searchQuery: string;
}) {
  if (loading) return <StripeLoadingRow />;
  if (unavailable) {
    return <UnavailableNote message={unavailableMessage} />;
  }

  const q = searchQuery.trim().toLowerCase();
  const filtered = subscriptions.filter((s) => {
    if (!q) return true;
    const planName = getSubscriptionPlanName(s).toLowerCase();
    const meta = Object.values(s.metadata ?? {})
      .join(" ")
      .toLowerCase();
    const customer = (
      typeof s.customer === "string" ? s.customer : ""
    ).toLowerCase();
    return planName.includes(q) || meta.includes(q) || customer.includes(q);
  });

  if (filtered.length === 0) {
    return <UnavailableNote message="No subscriptions found." />;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}
      >
        <thead>
          <tr>
            {["Customer", "Plan", "Status", "Next Renewal"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#7A7D90",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #1C1F33",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((sub) => (
            <tr
              key={sub.id}
              style={{ borderTop: "1px solid rgba(28,31,51,0.6)" }}
            >
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#EEF0F8",
                    fontWeight: 600,
                    fontFamily: "monospace",
                  }}
                >
                  {typeof sub.customer === "string" ? sub.customer : "—"}
                </div>
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  verticalAlign: "middle",
                  color: "#EEF0F8",
                  fontSize: 13,
                }}
              >
                {getSubscriptionPlanName(sub)}
              </td>
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <StripeBadge status={sub.status} />
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  verticalAlign: "middle",
                  color: "#7A7D90",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {sub.current_period_end
                  ? formatUnixDate(sub.current_period_end)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Transaction Tab: Payment Health ─────────────────────────────────────────

function PaymentHealthTab({
  charges,
  loading,
  unavailable,
  unavailableMessage,
}: {
  charges: StripeCharge[];
  loading: boolean;
  unavailable: boolean;
  unavailableMessage: string;
}) {
  if (loading) return <StripeLoadingRow />;
  if (unavailable) {
    return <UnavailableNote message={unavailableMessage} />;
  }

  const issues = charges.filter((c) => c.status === "failed" || c.refunded);

  if (issues.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px 0",
          color: "#5EF08A",
          fontSize: 13,
        }}
      >
        ✓ No payment issues found. All systems healthy.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}
      >
        <thead>
          <tr>
            {["Customer", "Amount", "Date", "Issue"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#7A7D90",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid #1C1F33",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map((charge) => (
            <tr
              key={charge.id}
              style={{
                borderTop: "1px solid rgba(239,68,68,0.15)",
                background:
                  charge.status === "failed"
                    ? "rgba(239,68,68,0.04)"
                    : undefined,
              }}
            >
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <div
                  style={{ fontSize: 13, color: "#EEF0F8", fontWeight: 600 }}
                >
                  {charge.billing_details?.name || charge.customer || "—"}
                </div>
                {charge.billing_details?.email && (
                  <div style={{ fontSize: 11, color: "#7A7D90", marginTop: 1 }}>
                    {charge.billing_details.email}
                  </div>
                )}
              </td>
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#f87171",
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                >
                  {formatCents(charge.amount)}
                </span>
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  verticalAlign: "middle",
                  color: "#7A7D90",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {formatUnixDate(charge.created)}
              </td>
              <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                <div>
                  <StripeBadge
                    status={charge.refunded ? "refunded" : "failed"}
                  />
                  {charge.failure_message && (
                    <div
                      style={{ fontSize: 11, color: "#7A7D90", marginTop: 3 }}
                    >
                      {charge.failure_message}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── OrderRow ────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  info,
  index,
  actor,
  onStatusChange,
}: {
  order: Order;
  info: ClientInfo | undefined;
  index: number;
  actor: { updateOrderStatus?: unknown; sendOrderStatusEmail?: unknown } | null;
  onStatusChange: (orderId: bigint, newKey: StatusKey) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentKey = getStatusKey(order.status);
  const clientPath = info ? `/admin/clients/${info.principalStr}` : "#";

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newKey = e.target.value as StatusKey;
    if (newKey === currentKey || !actor) return;
    setRowError(null);
    setUpdating(true);
    onStatusChange(order.id, newKey);
    try {
      const result = await (
        actor as Record<
          string,
          (...args: unknown[]) => Promise<{ err?: string }>
        >
      ).updateOrderStatus(getAdminEmail(), order.id, makeStatus(newKey));
      if (result && "err" in result) throw new Error("Update failed");
      if (EMAIL_TRIGGER_STATUSES.includes(newKey) && info) {
        try {
          await (
            actor as Record<string, (...args: unknown[]) => Promise<unknown>>
          ).sendOrderStatusEmail(
            order.client_id,
            makeStatus(newKey),
            info.email,
          );
        } catch {
          /* non-blocking */
        }
      }
      setShowCheck(true);
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
      checkTimerRef.current = setTimeout(() => setShowCheck(false), 2200);
    } catch {
      setRowError("Failed");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <tr
      data-ocid={`orders.table.row.${index}`}
      style={{ borderTop: "1px solid #1C1F33", transition: "background 0.15s" }}
    >
      <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "#7A7D90",
            whiteSpace: "nowrap",
          }}
        >
          #{order.id.toString()}
        </span>
      </td>
      <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
        {info ? (
          <Link
            to={clientPath}
            data-ocid={`orders.table.client_link.${index}`}
            style={{
              color: "#EEF0F8",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
            className="admin-order-client-link"
          >
            {info.name}
          </Link>
        ) : (
          <span style={{ color: "#7A7D90", fontSize: 14 }}>Unknown</span>
        )}
      </td>
      <td
        style={{
          padding: "12px 12px",
          verticalAlign: "middle",
          color: "#7A7D90",
          fontSize: 14,
        }}
      >
        {info?.businessName || <span style={{ color: "#1C1F33" }}>—</span>}
      </td>
      <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
        <span
          style={{
            background: "rgba(99,102,241,0.15)",
            color: "#a5b4fc",
            borderRadius: 4,
            padding: "3px 8px",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {order.tier_code}
        </span>
      </td>
      <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
        <StatusBadge statusKey={currentKey} />
      </td>
      <td
        style={{
          padding: "12px 12px",
          verticalAlign: "middle",
          color: "#7A7D90",
          fontSize: 13,
          whiteSpace: "nowrap",
        }}
      >
        {order.delivery_window || <span style={{ color: "#1C1F33" }}>—</span>}
      </td>
      <td
        style={{
          padding: "12px 12px",
          verticalAlign: "middle",
          color: "#7A7D90",
          fontSize: 13,
          whiteSpace: "nowrap",
        }}
      >
        {order.launch_target || <span style={{ color: "#1C1F33" }}>—</span>}
      </td>
      <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
          }}
        >
          <Link
            to={clientPath}
            data-ocid={`orders.table.view_button.${index}`}
            title="View client"
            style={{
              color: "#5EF08A",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <Eye size={17} />
          </Link>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <select
              data-ocid={`orders.table.status_select.${index}`}
              value={currentKey}
              onChange={handleChange}
              disabled={updating}
              style={{
                border: "1px solid #1C1F33",
                borderRadius: 6,
                padding: "5px 8px",
                fontSize: 12,
                color: "#EEF0F8",
                background: updating
                  ? "rgba(19,21,36,0.5)"
                  : "rgba(19,21,36,1)",
                cursor: updating ? "wait" : "pointer",
                outline: "none",
                minWidth: 120,
                maxWidth: 160,
              }}
            >
              {ALL_STATUS_KEYS.map((k) => (
                <option key={k} value={k}>
                  {STATUS_LABELS[k]}
                </option>
              ))}
            </select>
            {showCheck && (
              <span
                data-ocid={`orders.table.status_success_state.${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#5EF08A",
                  animation: "pulseCheck 2.2s ease-out forwards",
                }}
              >
                <CheckCircle size={15} />
              </span>
            )}
            {rowError && (
              <span style={{ fontSize: 11, color: "#f87171" }}>{rowError}</span>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { actor, isFetching } = useActor();

  // Order state
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientInfoMap, setClientInfoMap] = useState<Map<string, ClientInfo>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilterOption>("all");

  // Stripe state
  const [stripeData, setStripeData] = useState<StripeData | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeUnavailable, setStripeUnavailable] = useState(false);
  const [stripeNotConfigured, setStripeNotConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<TransactionTab>("one-time");

  // Load orders
  useEffect(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    const adminEmail = getAdminEmail();
    const aa = actor as unknown as {
      getAdminAllOrders: (email: string) => Promise<Order[]>;
      getAdminAllClients: (email: string) => Promise<ClientSummary[]>;
    };
    Promise.all([
      aa.getAdminAllOrders(adminEmail),
      aa.getAdminAllClients(adminEmail),
    ])
      .then(([ordersData, clientsData]) => {
        setOrders(ordersData);
        const map = new Map<string, ClientInfo>();
        for (const c of clientsData) {
          const id = c.profile.principal?.toString?.() ?? "";
          const name =
            `${c.profile.firstName} ${c.profile.lastName}`.trim() ||
            c.profile.email;
          map.set(id, {
            name,
            email: c.profile.email,
            businessName: c.profile.businessName ?? "",
            principalStr: id,
          });
        }
        setClientInfoMap(map);
      })
      .catch(() => setError("Failed to load orders. Please refresh."))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  // Load Stripe data (non-blocking — separate from orders)
  useEffect(() => {
    if (!actor || isFetching) return;
    setStripeLoading(true);

    const a = actor as backendInterface;
    const stripeAdminEmail = getAdminEmail();
    const emptyStripeData = {
      charges: [] as StripeCharge[],
      subscriptions: [] as StripeSubscription[],
      payouts: [] as StripePayout[],
      customers: [] as StripeCustomer[],
      monthlyRevenue: 0,
      pendingPayouts: 0,
      customerCount: 0,
    };

    // Check configuration before fetching
    actor
      .isStripeConfigured()
      .catch(() => false)
      .then((configured) => {
        if (!configured) {
          setStripeNotConfigured(true);
          setStripeUnavailable(true);
          setStripeData(emptyStripeData);
          setStripeLoading(false);
          return Promise.resolve();
        }
        setStripeNotConfigured(false);
        return Promise.all([
          a.getStripeCharges(stripeAdminEmail),
          a.getStripeSubscriptions(stripeAdminEmail),
          a.getStripePayouts(stripeAdminEmail),
          a.getStripeCustomers(stripeAdminEmail),
        ])
          .then(([chargesRes, subsRes, payoutsRes, customersRes]) => {
            const chargesParsed =
              "ok" in chargesRes
                ? safeParseStripe<StripeChargesResponse>(
                    (chargesRes as { ok: string }).ok,
                  )
                : null;
            const subsParsed =
              "ok" in subsRes
                ? safeParseStripe<StripeSubscriptionsResponse>(
                    (subsRes as { ok: string }).ok,
                  )
                : null;
            const payoutsParsed =
              "ok" in payoutsRes
                ? safeParseStripe<StripePayoutsResponse>(
                    (payoutsRes as { ok: string }).ok,
                  )
                : null;
            const customersParsed =
              "ok" in customersRes
                ? safeParseStripe<StripeCustomersResponse>(
                    (customersRes as { ok: string }).ok,
                  )
                : null;

            const charges = chargesParsed?.data ?? [];
            const subscriptions = subsParsed?.data ?? [];
            const payouts = payoutsParsed?.data ?? [];
            const customers = customersParsed?.data ?? [];

            // Compute revenue metrics
            const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
            const monthlyRevenue = charges
              .filter(
                (c) => c.status === "succeeded" && c.created >= thirtyDaysAgo,
              )
              .reduce((sum, c) => sum + c.amount, 0);

            const pendingPayouts = payouts
              .filter(
                (p) => p.status === "pending" || p.status === "in_transit",
              )
              .reduce((sum, p) => sum + p.amount, 0);

            const customerCount = customers.length;

            const unavailable =
              charges.length === 0 &&
              subscriptions.length === 0 &&
              payouts.length === 0 &&
              customers.length === 0;

            setStripeUnavailable(unavailable);
            setStripeData({
              charges,
              subscriptions,
              payouts,
              customers,
              monthlyRevenue,
              pendingPayouts,
              customerCount,
            });
          })
          .catch(() => {
            setStripeUnavailable(true);
            setStripeData(emptyStripeData);
          })
          .finally(() => setStripeLoading(false));
      });
  }, [actor, isFetching]);

  // Internal stats
  const stats = useMemo(() => {
    const total = orders.length;
    const activeBuilds = orders.filter(
      (o) => !NON_ACTIVE_STATUSES.includes(getStatusKey(o.status)),
    ).length;
    const launchedThisMonth = orders.filter((o) => {
      const key = getStatusKey(o.status);
      return key === "live" && isCurrentMonth(tsToDate(o.updated_at));
    }).length;
    const cancelledThisMonth = orders.filter((o) => {
      const key = getStatusKey(o.status);
      return key === "cancelled" && isCurrentMonth(tsToDate(o.updated_at));
    }).length;
    return { total, activeBuilds, launchedThisMonth, cancelledThisMonth };
  }, [orders]);

  // Filter logic — enhanced with Stripe subscription status
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const clientIdStr = o.client_id?.toString?.() ?? "";
      const info = clientInfoMap.get(clientIdStr);
      const clientName = (info?.name ?? "").toLowerCase();
      const businessName = (info?.businessName ?? "").toLowerCase();
      const matchesSearch =
        !q ||
        clientName.includes(q) ||
        businessName.includes(q) ||
        o.tier_code.toLowerCase().includes(q);

      const statusKey = getStatusKey(o.status);
      let matchesFilter = true;
      if (filter === "active") {
        const activeStatuses: StatusKey[] = [
          "buildInProgress",
          "depositReceived",
          "questionnairePending",
          "questionnaireComplete",
          "depositSent",
          "draftReady",
          "revisionsInProgress",
        ];
        matchesFilter = activeStatuses.includes(statusKey);
      } else if (filter === "live") {
        matchesFilter = statusKey === "live" || statusKey === "launching";
      } else if (filter === "paused") {
        matchesFilter = statusKey === "paused";
      } else if (filter === "cancelled") {
        matchesFilter = statusKey === "cancelled";
      }
      return matchesSearch && matchesFilter;
    });
  }, [orders, clientInfoMap, search, filter]);

  // Stripe search results shown inline when search is active
  const stripeSearchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !stripeData) return { charges: [], subscriptions: [] };

    const matchedCharges = stripeData.charges.filter((c) => {
      const name = (c.billing_details?.name ?? "").toLowerCase();
      const email = (c.billing_details?.email ?? "").toLowerCase();
      const meta = Object.values(c.metadata ?? {})
        .join(" ")
        .toLowerCase();
      return name.includes(q) || email.includes(q) || meta.includes(q);
    });

    const matchedSubs = stripeData.subscriptions.filter((s) => {
      const planName = getSubscriptionPlanName(s).toLowerCase();
      const meta = Object.values(s.metadata ?? {})
        .join(" ")
        .toLowerCase();
      return planName.includes(q) || meta.includes(q);
    });

    return { charges: matchedCharges, subscriptions: matchedSubs };
  }, [search, stripeData]);

  function handleStatusChange(orderId: bigint, newKey: StatusKey) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: makeStatus(newKey) } : o,
      ),
    );
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid #1C1F33",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 14,
    color: "#EEF0F8",
    background: "rgba(19,21,36,1)",
    outline: "none",
    boxSizing: "border-box",
    height: 42,
  };

  const DARK_CARD: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid #1C1F33",
    borderRadius: 8,
  };

  const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

  const tabsConfig: { key: TransactionTab; label: string }[] = [
    { key: "one-time", label: "One-Time Payments" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "health", label: "Payment Health" },
  ];

  const searchActive = search.trim().length > 0;
  const hasStripeSearchResults =
    searchActive &&
    (stripeSearchResults.charges.length > 0 ||
      stripeSearchResults.subscriptions.length > 0);

  return (
    <AdminLayout pageTitle="Orders">
      <style>{`
        .admin-order-client-link:hover { text-decoration: underline !important; }
        @keyframes pulseCheck {
          0%   { opacity: 0; transform: scale(0.7); }
          15%  { opacity: 1; transform: scale(1.15); }
          30%  { transform: scale(1); }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .stripe-tab-btn { transition: color 0.15s, border-color 0.15s; }
        .stripe-tab-btn:hover { color: #EEF0F8 !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* ── Row 1: Internal Stats ─────────────────────────────────────── */}
        <div
          data-ocid="orders.stats.panel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            paddingLeft: 2,
          }}
        >
          {[
            { count: stats.total, label: "Total Orders" },
            { count: stats.activeBuilds, label: "Active Builds" },
            { count: stats.launchedThisMonth, label: "Launched This Month" },
            { count: stats.cancelledThisMonth, label: "Cancelled This Month" },
          ].map(({ count, label }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "baseline", gap: 4 }}
            >
              <span style={{ fontWeight: 700, color: "#EEF0F8", fontSize: 16 }}>
                {loading ? "—" : count}
              </span>
              <span style={{ color: "#7A7D90", fontSize: 12 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Row 2: Stripe Revenue Stats ───────────────────────────────── */}
        <div
          data-ocid="orders.stripe.stats.panel"
          style={{
            ...DARK_CARD,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {stripeLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#5EF08A", fontSize: 11, opacity: 0.7 }}>
                ● Loading Stripe data...
              </span>
            </div>
          ) : stripeUnavailable ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#7A7D90", fontSize: 12 }}>
                {stripeNotConfigured
                  ? "Configure your Stripe keys in Settings to see live data"
                  : "Revenue data temporarily unavailable — Stripe API may be loading"}
              </span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#5EF08A",
                    fontSize: 18,
                    fontFamily: "monospace",
                  }}
                >
                  {formatCents(stripeData?.monthlyRevenue ?? 0)}
                </span>
                <span style={{ color: "#7A7D90", fontSize: 12 }}>
                  Monthly Revenue
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  height: 20,
                  background: "#1C1F33",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#fbbf24",
                    fontSize: 18,
                    fontFamily: "monospace",
                  }}
                >
                  {formatCents(stripeData?.pendingPayouts ?? 0)}
                </span>
                <span style={{ color: "#7A7D90", fontSize: 12 }}>
                  Pending Payouts
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  height: 20,
                  background: "#1C1F33",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  style={{ fontWeight: 700, color: "#EEF0F8", fontSize: 18 }}
                >
                  {stripeData?.customerCount ?? 0}
                </span>
                <span style={{ color: "#7A7D90", fontSize: 12 }}>
                  Customer Count
                </span>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#5EF08A",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "#5EF08A", fontSize: 11 }}>
                  Stripe Live
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Filter Bar (PRESERVED exactly) ───────────────────────────── */}
        <div
          style={{
            ...DARK_CARD,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <input
            data-ocid="orders.search_input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name or tier."
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
          <select
            data-ocid="orders.filter.select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as OrderFilterOption)}
            style={{
              ...inputStyle,
              paddingRight: 32,
              cursor: "pointer",
              minWidth: 160,
              appearance: "auto",
            }}
          >
            <option value="all">All Orders</option>
            <option value="active">Active</option>
            <option value="live">Live</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            data-ocid="orders.export.button"
            onClick={() => exportOrdersCSV(filtered, clientInfoMap)}
            disabled={loading || filtered.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "0 14px",
              height: 42,
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              background: "transparent",
              cursor:
                loading || filtered.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || filtered.length === 0 ? 0.5 : 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {error && (
          <div
            data-ocid="orders.error_state"
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

        {/* ── Orders Table (PRESERVED) ──────────────────────────────────── */}
        <div
          data-ocid="orders.table"
          style={{ ...DARK_CARD, padding: 24, width: "100%" }}
        >
          {loading ? (
            <div
              data-ocid="orders.loading_state"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {SKELETON_ROWS.map((k) => (
                <Skeleton
                  key={k}
                  style={{
                    height: 20,
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                  }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="orders.empty_state"
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#7A7D90",
                fontSize: 14,
              }}
            >
              No orders found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Order ID",
                      "Client Name",
                      "Business Name",
                      "Tier",
                      "Status",
                      "Delivery Window",
                      "Launch Target",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#7A7D90",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderBottom: "1px solid #1C1F33",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, idx) => {
                    const clientIdStr = order.client_id?.toString?.() ?? "";
                    const info = clientInfoMap.get(clientIdStr);
                    return (
                      <OrderRow
                        key={order.id.toString()}
                        order={order}
                        info={info}
                        index={idx + 1}
                        actor={actor}
                        onStatusChange={handleStatusChange}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Stripe Search Results (shown only when searching) ─────────── */}
        {hasStripeSearchResults && (
          <div
            data-ocid="orders.stripe.search_results"
            style={{ ...DARK_CARD, padding: 20 }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#5EF08A",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Stripe Matches for "{search}"
            </div>
            {stripeSearchResults.charges.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#7A7D90",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Charges ({stripeSearchResults.charges.length})
                </div>
                {stripeSearchResults.charges.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(28,31,51,0.5)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "#EEF0F8",
                        fontWeight: 600,
                      }}
                    >
                      {c.billing_details?.name || c.customer || "—"}
                    </span>
                    <span style={{ fontSize: 13, color: "#7A7D90" }}>
                      {c.billing_details?.email}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: "#5EF08A",
                        marginLeft: "auto",
                      }}
                    >
                      {formatCents(c.amount)}
                    </span>
                    <StripeBadge status={c.refunded ? "refunded" : c.status} />
                  </div>
                ))}
              </div>
            )}
            {stripeSearchResults.subscriptions.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#7A7D90",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Subscriptions ({stripeSearchResults.subscriptions.length})
                </div>
                {stripeSearchResults.subscriptions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(28,31,51,0.5)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "#EEF0F8",
                        fontWeight: 600,
                      }}
                    >
                      {getSubscriptionPlanName(s)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#7A7D90",
                        fontFamily: "monospace",
                      }}
                    >
                      {typeof s.customer === "string" ? s.customer : ""}
                    </span>
                    <span style={{ marginLeft: "auto" }}>
                      <StripeBadge status={s.status} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Transaction Tabs ──────────────────────────────────────────── */}
        <div
          data-ocid="orders.transaction.tabs"
          style={{ ...DARK_CARD, overflow: "hidden" }}
        >
          {/* Tab Navigation */}
          <div
            className="tabs-scroll-container"
            style={{
              display: "flex",
              borderBottom: "1px solid #1C1F33",
              background: "rgba(19,21,36,0.5)",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
              msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
              overscrollBehavior: "contain",
            }}
          >
            {tabsConfig.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className="stripe-tab-btn"
                data-ocid={`orders.tab.${key}`}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "12px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: activeTab === key ? "#EEF0F8" : "#7A7D90",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === key
                      ? "2px solid #5EF08A"
                      : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: 20 }}>
            {activeTab === "one-time" && (
              <OneTimePaymentsTab
                charges={stripeData?.charges ?? []}
                loading={stripeLoading}
                unavailable={stripeUnavailable}
                unavailableMessage={
                  stripeNotConfigured
                    ? "Configure your Stripe keys in Settings to see live data"
                    : "Revenue data temporarily unavailable — Stripe API may be loading"
                }
                searchQuery={search}
              />
            )}
            {activeTab === "subscriptions" && (
              <SubscriptionsTab
                subscriptions={stripeData?.subscriptions ?? []}
                loading={stripeLoading}
                unavailable={stripeUnavailable}
                unavailableMessage={
                  stripeNotConfigured
                    ? "Configure your Stripe keys in Settings to see live data"
                    : "Revenue data temporarily unavailable — Stripe API may be loading"
                }
                searchQuery={search}
              />
            )}
            {activeTab === "health" && (
              <PaymentHealthTab
                charges={stripeData?.charges ?? []}
                loading={stripeLoading}
                unavailable={stripeUnavailable}
                unavailableMessage={
                  stripeNotConfigured
                    ? "Configure your Stripe keys in Settings to see live data"
                    : "Revenue data temporarily unavailable — Stripe API may be loading"
                }
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
