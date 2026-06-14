import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
} from "lucide-react";
import type { CSSProperties, ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { UserProfile, backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

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
type TransactionTab = "one-time" | "subscriptions" | "health" | "payouts";

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
  description?: string | null;
  bank_account?: { last4?: string } | null;
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

// ─── Timeline Constants ─────────────────────────────────────────────────────

const MAIN_STAGES = ["New", "In Review", "In Progress", "Completed"] as const;
type MainStage = (typeof MAIN_STAGES)[number];
const CANCEL_STAGES = ["Cancellation Requested", "Cancelled"] as const;

const ALL_TIMELINE_STATUSES: readonly string[] = [
  ...MAIN_STAGES,
  ...CANCEL_STAGES,
];

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
  amount: number;
  stripeSessionId?: string;
  clientEmail?: string;
  serviceName?: string;
}

interface ClientInfo {
  name: string;
  email: string;
  businessName: string;
  /** Stored as email since UserProfile has no principal field. */
  principalStr: string;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function getStatusKey(status: Record<string, null>): StatusKey {
  return Object.keys(status)[0] as StatusKey;
}

function makeStatus(key: StatusKey): Record<string, null> {
  return { [key]: null };
}

function tsToDate(ns: bigint): Date | null {
  if (ns === 0n) return null;
  return new Date(Number(ns) / 1_000_000);
}

function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
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
function truncatePrincipal(principal: string): string {
  if (principal.length <= 12) return principal;
  return `${principal.substring(0, 6)}...${principal.substring(principal.length - 3)}`;
}

function exportCartOrdersCSV(orders: Order[]) {
  const headers = [
    "Order ID",
    "Client Email",
    "Service Name",
    "Amount",
    "Status",
    "Date",
  ];
  const csvEscape = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
  const lines = orders.map((o) => {
    const email = o.clientEmail ?? "";
    const serviceName = o.serviceName ?? "";
    const amount =
      o.amount !== undefined && o.amount > 0 ? o.amount.toFixed(2) : "0.00";
    let dateStr = "—";
    if (o.created_at && o.created_at !== 0n) {
      const ms = Number(o.created_at / 1_000_000n);
      if (!Number.isNaN(ms) && ms > 0) {
        dateStr = new Date(ms).toISOString().slice(0, 10);
      }
    }
    const statusKey = getStatusKey(o.status);
    const statusLabel = STATUS_LABELS[statusKey] ?? statusKey;
    return [
      csvEscape(o.id.toString()),
      csvEscape(email),
      csvEscape(serviceName),
      amount,
      csvEscape(statusLabel),
      csvEscape(dateStr),
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

// ─── Payouts Excel export ────────────────────────────────────────────────────

function exportPayoutsExcel(payouts: StripePayout[]) {
  const rows = payouts.map((p) => ({
    "Payout ID": p.id,
    Amount: `${(p.amount / 100).toFixed(2)}`,
    Currency: p.currency.toUpperCase(),
    Status: p.status,
    "Arrival Date": new Date(p.arrival_date * 1000).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    ),
    "Description / Bank":
      p.description ||
      (p.bank_account?.last4
        ? `\u00b7\u00b7\u00b7\u00b7${p.bank_account.last4}`
        : ""),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payouts");
  XLSX.writeFile(wb, "Imperidome_Payouts.xlsx");
}

// ─── Transaction Tab: Payouts ───────────────────────────────────────────────

function PayoutsTab({ payouts }: { payouts: StripePayout[] }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredPayouts = payouts.filter((p) => {
    const arrivalDateStr = new Date(p.arrival_date * 1000)
      .toISOString()
      .split("T")[0];
    if (fromDate && arrivalDateStr < fromDate) return false;
    if (toDate && arrivalDateStr > toDate) return false;
    return true;
  });

  const inputStyle: CSSProperties = {
    border: "1px solid #1C1F33",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    color: "#EEF0F8",
    background: "rgba(19,21,36,1)",
    outline: "none",
    height: 40,
    boxSizing: "border-box" as const,
    colorScheme: "dark",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Export button row */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          data-ocid="orders.payouts.export_excel_button"
          onClick={() => exportPayoutsExcel(filteredPayouts)}
          disabled={filteredPayouts.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            padding: "0 14px",
            height: 38,
            fontSize: 13,
            fontWeight: 600,
            color: "white",
            background: "transparent",
            cursor: filteredPayouts.length === 0 ? "not-allowed" : "pointer",
            opacity: filteredPayouts.length === 0 ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          <Download size={14} />
          Export Excel
        </button>
      </div>
      {/* Date range filter row — matches Finance tab filter style exactly */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label
            htmlFor="payouts-date-from"
            style={{
              fontSize: 12,
              color: "#7A7D90",
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            From
          </label>
          <input
            id="payouts-date-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            data-ocid="orders.payouts.date_from_input"
            style={{
              ...inputStyle,
              color: fromDate ? "#EEF0F8" : "#7A7D90",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label
            htmlFor="payouts-date-to"
            style={{
              fontSize: 12,
              color: "#7A7D90",
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            To
          </label>
          <input
            id="payouts-date-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            data-ocid="orders.payouts.date_to_input"
            style={{
              ...inputStyle,
              color: toDate ? "#EEF0F8" : "#7A7D90",
            }}
          />
        </div>
        {(fromDate || toDate) && (
          <button
            type="button"
            data-ocid="orders.payouts.date_clear_button"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            style={{
              border: "1px solid #1C1F33",
              borderRadius: 6,
              padding: "0 12px",
              height: 40,
              fontSize: 12,
              fontWeight: 700,
              color: "#7A7D90",
              background: "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Clear
          </button>
        )}
        {(fromDate || toDate) && (
          <span style={{ fontSize: 12, color: "#7A7D90", marginLeft: 4 }}>
            Showing {filteredPayouts.length} of {payouts.length} payout
            {payouts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Payouts table */}
      {filteredPayouts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: "#7A7D90",
            fontSize: 13,
          }}
        >
          {payouts.length === 0
            ? "No payouts found."
            : "No payouts in the selected date range."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}
          >
            <thead>
              <tr>
                {[
                  "Payout ID",
                  "Amount",
                  "Currency",
                  "Status",
                  "Arrival Date",
                  "Description / Bank",
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
              {filteredPayouts.map((payout) => {
                const descOrBank =
                  payout.description ||
                  (payout.bank_account?.last4
                    ? `\u00b7\u00b7\u00b7\u00b7${payout.bank_account.last4}`
                    : null);
                return (
                  <tr
                    key={payout.id}
                    style={{ borderTop: "1px solid rgba(28,31,51,0.6)" }}
                  >
                    <td
                      style={{ padding: "10px 12px", verticalAlign: "middle" }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "#7A7D90",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {payout.id.length > 14
                          ? `${payout.id.slice(0, 14)}\u2026`
                          : payout.id}
                      </span>
                    </td>
                    <td
                      style={{ padding: "10px 12px", verticalAlign: "middle" }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#EEF0F8",
                          fontSize: 13,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatCents(payout.amount)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        verticalAlign: "middle",
                        color: "#7A7D90",
                        fontSize: 13,
                        textTransform: "uppercase",
                      }}
                    >
                      {payout.currency}
                    </td>
                    <td
                      style={{ padding: "10px 12px", verticalAlign: "middle" }}
                    >
                      <StripeBadge status={payout.status} />
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
                      {formatUnixDate(payout.arrival_date)}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        verticalAlign: "middle",
                        color: descOrBank ? "#EEF0F8" : "#7A7D90",
                        fontSize: 13,
                      }}
                    >
                      {descOrBank ?? "\u2014"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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

// ─── OrderTimeline ───────────────────────────────────────────────────────────

function getOrderStatusStr(status: Record<string, null>): string {
  try {
    const key = Object.keys(status as unknown as Record<string, unknown>)[0];
    return key ?? String(status);
  } catch {
    return String(status);
  }
}

function OrderTimeline({
  order,
  actor,
  onStatusChange,
}: {
  order: Order;
  actor: { updateOrderStatus?: unknown } | null;
  onStatusChange: (orderId: bigint, newKey: StatusKey) => void;
}) {
  const statusStr = getOrderStatusStr(order.status);
  const cancelStageSet = new Set<string>(CANCEL_STAGES);
  const isCancel = cancelStageSet.has(statusStr);

  // Determine how far along the main stages we are
  const mainIdx = MAIN_STAGES.indexOf(statusStr as MainStage);
  // If in cancel branch, the last main stage reached is "In Progress" (index 2)
  const lastMainReached = isCancel ? 2 : mainIdx;

  const [timelineUpdating, setTimelineUpdating] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineSuccess, setTimelineSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleTimelineStatusChange(newStatus: string) {
    if (!actor || newStatus === statusStr) return;
    setTimelineError(null);
    setTimelineUpdating(true);
    // Capture previous status for rollback on failure
    const previousStatus = statusStr;
    // Check if it maps to a legacy StatusKey first, otherwise use as-is
    const legacyKeys = ALL_STATUS_KEYS as readonly string[];
    if (legacyKeys.includes(newStatus)) {
      onStatusChange(order.id, newStatus as StatusKey);
    }
    try {
      const result = await (
        actor as Record<
          string,
          (...args: unknown[]) => Promise<{ err?: string }>
        >
      ).updateOrderStatus(String(order.id), newStatus);
      if (result && "err" in result) throw new Error("Update failed");
      setTimelineSuccess(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setTimelineSuccess(false), 2200);
    } catch {
      setTimelineError("Failed to update status");
      // Revert optimistic status update on failure
      if (legacyKeys.includes(previousStatus)) {
        onStatusChange(order.id, previousStatus as StatusKey);
      }
    } finally {
      setTimelineUpdating(false);
    }
  }

  const dotBase: CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "2px solid",
    fontSize: 8,
    fontWeight: 800,
  };

  return (
    <div style={{ padding: "16px 20px", background: "rgba(10,11,22,0.5)" }}>
      {/* Timeline row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          marginBottom: 20,
          flexWrap: "nowrap",
          overflowX: "auto",
        }}
      >
        {MAIN_STAGES.map((stage, i) => {
          const reached = lastMainReached >= i;
          return (
            <div
              key={stage}
              style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 72,
                }}
              >
                <div
                  style={{
                    ...dotBase,
                    background: reached ? "#5EF08A" : "transparent",
                    borderColor: reached ? "#5EF08A" : "#3A3D50",
                    color: reached ? "#0a0b16" : "#3A3D50",
                  }}
                >
                  {reached && "✓"}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: reached ? "#EEF0F8" : "#3A3D50",
                    fontWeight: reached ? 700 : 400,
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {stage}
                </span>
              </div>
              {i < MAIN_STAGES.length - 1 && (
                <div
                  style={{
                    height: 2,
                    width: 40,
                    background: lastMainReached > i ? "#5EF08A" : "#1C1F33",
                    flexShrink: 0,
                    marginBottom: 22,
                  }}
                />
              )}
            </div>
          );
        })}
        {/* Cancel branch */}
        {isCancel && (
          <>
            <div
              style={{
                height: 2,
                width: 32,
                background: "#f87171",
                flexShrink: 0,
                marginBottom: 22,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 80,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  ...dotBase,
                  background: "#f87171",
                  borderColor: "#f87171",
                  color: "#0a0b16",
                }}
              >
                ✕
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: "#f87171",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                {statusStr}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Status update dropdown */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#7A7D90",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Update Status:
        </span>
        <select
          data-ocid={`orders.timeline.status_select.${order.id.toString()}`}
          value={statusStr}
          disabled={timelineUpdating}
          onChange={(e) => handleTimelineStatusChange(e.target.value)}
          style={{
            border: "1px solid #1C1F33",
            borderRadius: 6,
            padding: "5px 8px",
            fontSize: 12,
            color: "#EEF0F8",
            background: timelineUpdating
              ? "rgba(19,21,36,0.5)"
              : "rgba(19,21,36,1)",
            cursor: timelineUpdating ? "wait" : "pointer",
            outline: "none",
            minWidth: 180,
          }}
        >
          {ALL_TIMELINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {timelineSuccess && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              color: "#5EF08A",
              fontSize: 12,
            }}
          >
            <CheckCircle size={13} style={{ marginRight: 4 }} /> Updated
          </span>
        )}
        {timelineError && (
          <span style={{ fontSize: 11, color: "#f87171" }}>
            {timelineError}
          </span>
        )}
      </div>
    </div>
  );
}

function OrderRow({
  order,
  info,
  index,
  actor,
  onStatusChange,
  isExpanded,
  onToggleExpand,
}: {
  order: Order;
  info: ClientInfo | undefined;
  index: number;
  actor: { updateOrderStatus?: unknown; sendOrderStatusEmail?: unknown } | null;
  onStatusChange: (orderId: bigint, newKey: StatusKey) => void;
  isExpanded: boolean;
  onToggleExpand: (id: bigint) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentKey = getStatusKey(order.status);
  const clientPath = info ? `/admin/clients/${info.principalStr}` : "#";

  async function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const newKey = e.target.value as StatusKey;
    if (newKey === currentKey || !actor) return;
    setRowError(null);
    setUpdating(true);
    onStatusChange(order.id, newKey);
    try {
      // updateOrderStatus: adminEmail, orderId as string, status as plain string
      const result = await (
        actor as Record<
          string,
          (...args: unknown[]) => Promise<{ err?: string }>
        >
      ).updateOrderStatus(String(order.id), newKey);
      if (result && "err" in result) throw new Error("Update failed");
      // sendOrderStatusEmail: clientPrincipal (Principal), status (Status), clientEmail (string)
      if (EMAIL_TRIGGER_STATUSES.includes(newKey) && info) {
        try {
          await (
            actor as Record<string, (...args: unknown[]) => Promise<unknown>>
          ).sendOrderStatusEmail(
            order.client_id, // Principal — pass directly from order
            { [newKey]: null }, // status variant object as backend expects
            info.email, // clientEmail resolved from clientInfoMap
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
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggleExpand(order.id);
      }}
      style={{
        borderTop: "1px solid #1C1F33",
        transition: "background 0.15s",
        cursor: "pointer",
      }}
      onClick={(e) => {
        // Don't toggle if clicking an interactive element inside the row
        const target = e.target as HTMLElement;
        if (
          target.tagName === "SELECT" ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.closest("a, button, select")
        )
          return;
        onToggleExpand(order.id);
      }}
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
          <span
            style={{ color: "#7A7D90", fontSize: 14, fontFamily: "monospace" }}
          >
            {truncatePrincipal(order.client_id?.toString?.() ?? "")}
          </span>
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
      <td style={{ padding: "10px 12px", color: "#ccc" }}>
        {order.amount > 0 ? `${order.amount.toFixed(2)}` : "—"}
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
          <button
            type="button"
            data-ocid={`orders.table.expand_button.${index}`}
            aria-label={isExpanded ? "Collapse row" : "Expand row"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(order.id);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isExpanded ? "#5EF08A" : "#7A7D90",
              display: "flex",
              alignItems: "center",
              padding: 2,
              flexShrink: 0,
            }}
          >
            {isExpanded ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )}
          </button>
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
          {order.stripeSessionId && (
            <a
              href={`https://dashboard.stripe.com/payments/${order.stripeSessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid={`orders.table.stripe_link.${index}`}
              style={{
                color: "#7A7D90",
                fontSize: 11,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#a5b4fc";
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#7A7D90";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              View in Stripe
            </a>
          )}
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

const PAGE_SIZE = 50;

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
  const [emailSearch, setEmailSearch] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("");
  const [filter, setFilter] = useState<OrderFilterOption>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<bigint | null>(null);
  // Stripe state
  const [stripeData, setStripeData] = useState<StripeData | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeUnavailable, setStripeUnavailable] = useState(false);
  const [stripeNotConfigured, setStripeNotConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<TransactionTab>("one-time");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);

  // fetchOrders is extracted so the Refresh button can call it directly
  // without needing a refreshKey counter in the dep array.
  const fetchOrders = useCallback(() => {
    if (!actor || isFetching) return;
    setLoading(true);
    setError(null);
    const aa = actor as unknown as {
      getAdminAllOrders: () => Promise<Order[]>;
    };
    aa.getAdminAllOrders()
      .then((ordersData) => {
        setOrders(ordersData);
      })
      .catch(() => setError("Failed to load orders. Please refresh."))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  // Load orders — only fetches orders; client name resolution happens in a
  // separate effect below so it can re-run after every refresh.
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Resolve client names via getClientByPrincipal — runs once after orders
  // load and again after any refresh.  Batches all unique principals
  // concurrently with Promise.all so resolution is O(1) per render.
  useEffect(() => {
    if (!actor || isFetching || orders.length === 0) return;
    const a = actor as backendInterface;
    // Collect unique principal strings from the loaded orders
    const uniquePrincipals = Array.from(
      new Set(
        orders.map((o) => o.client_id?.toString?.() ?? "").filter(Boolean),
      ),
    );
    Promise.all(
      uniquePrincipals.map(async (principalStr) => {
        try {
          // Pass the raw client_id Principal directly — find the matching order
          const matchingOrder = orders.find(
            (o) => (o.client_id?.toString?.() ?? "") === principalStr,
          );
          if (!matchingOrder) return { principalStr, profile: null };
          const profile = await a.getClientByPrincipal(
            matchingOrder.client_id as unknown as Principal,
          );
          return { principalStr, profile: profile ?? null };
        } catch {
          return { principalStr, profile: null };
        }
      }),
    ).then((results) => {
      const profileMap: Record<string, UserProfile> = {};
      const infoMap = new Map<string, ClientInfo>();
      for (const { principalStr, profile } of results) {
        if (!profile) continue;
        profileMap[principalStr] = profile;
        // Also populate clientInfoMap (keyed by principal) for CSV export
        const name =
          `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
        infoMap.set(principalStr, {
          name,
          email: profile.email,
          businessName: profile.businessName ?? "",
          principalStr,
        });
      }
      setClientInfoMap(infoMap);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, actor, isFetching]);

  // Load Stripe data (non-blocking — separate from orders)
  useEffect(() => {
    if (!actor || isFetching) return;
    setStripeLoading(true);

    const a = actor as backendInterface;
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
          a.getStripeCharges(),
          a.getStripeSubscriptions(),
          a.getStripePayouts(),
          a.getStripeCustomers(),
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

  // Derive ClientInfo from the resolved UserProfile map for use in order rows.
  // clientInfoMap is now also principal-keyed (populated by the resolution
  // effect above), so this is O(1) per lookup.
  const principalToClient = useMemo<Map<string, ClientInfo>>(() => {
    return clientInfoMap;
  }, [clientInfoMap]);

  // Internal stats
  const stats = useMemo(() => {
    const total = orders.length;
    const activeBuilds = orders.filter(
      (o) => !NON_ACTIVE_STATUSES.includes(getStatusKey(o.status)),
    ).length;
    const launchedThisMonth = orders.filter((o) => {
      const key = getStatusKey(o.status);
      const d1 = tsToDate(o.updated_at);
      return key === "live" && !!d1 && isCurrentMonth(d1);
    }).length;
    const cancelledThisMonth = orders.filter((o) => {
      const key = getStatusKey(o.status);
      const d2 = tsToDate(o.updated_at);
      return key === "cancelled" && !!d2 && isCurrentMonth(d2);
    }).length;
    return { total, activeBuilds, launchedThisMonth, cancelledThisMonth };
  }, [orders]);

  // Derive unique service types from loaded orders for the service type filter
  const serviceTypes = useMemo(() => {
    const types = orders
      .map((o) => o.tier_code)
      .filter((t) => t && t.length > 0);
    return Array.from(new Set(types)).sort();
  }, [orders]);

  // Reset to page 1 when search, emailSearch, serviceTypeFilter, or filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reset on search/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, emailSearch, serviceTypeFilter, filter]);

  // Filter logic — uses principal-keyed principalToClient (O(1) lookups)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const eq = emailSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const clientIdStr = o.client_id?.toString?.() ?? "";
      const info = principalToClient.get(clientIdStr);
      const clientName = (info?.name ?? "").toLowerCase();
      const businessName = (info?.businessName ?? "").toLowerCase();
      const matchesSearch =
        !q ||
        clientName.includes(q) ||
        businessName.includes(q) ||
        o.tier_code.toLowerCase().includes(q);

      // Email search filter — case-insensitive substring match on clientEmail
      const matchesEmail =
        !eq || (o.clientEmail ?? "").toLowerCase().includes(eq);

      // Service type filter — case-insensitive substring match on tier_code
      const matchesServiceType =
        serviceTypeFilter === "" ||
        o.tier_code.toLowerCase().includes(serviceTypeFilter.toLowerCase());

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
      return (
        matchesSearch && matchesEmail && matchesServiceType && matchesFilter
      );
    });
  }, [
    orders,
    principalToClient,
    search,
    emailSearch,
    serviceTypeFilter,
    filter,
  ]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const paginationStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const paginationEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  function handleStatusChange(orderId: bigint, newKey: StatusKey) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: makeStatus(newKey) } : o,
      ),
    );
  }

  const inputStyle: CSSProperties = {
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

  const DARK_CARD: CSSProperties = {
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
    { key: "payouts", label: "Payouts" },
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
        @media (max-width: 767px) {
          .orders-tab-mobile-header { display: flex !important; }
          .orders-tab-desktop-row { display: none !important; }
        }
        @media (min-width: 768px) {
          .orders-tab-mobile-header { display: none !important; }
          .orders-tab-desktop-row { display: flex !important; }
        }
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
              {/* Payouts Summary stat card */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    color: "#7A7D90",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Payouts Summary
                </span>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 4 }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#5EF08A",
                        fontSize: 18,
                        fontFamily: "monospace",
                      }}
                    >
                      {stripeData && (stripeData.payouts ?? []).length > 0
                        ? formatCents(
                            (stripeData.payouts ?? [])
                              .filter((p) => p.status === "paid")
                              .reduce((s, p) => s + p.amount, 0),
                          )
                        : "—"}
                    </span>
                    <span style={{ color: "#7A7D90", fontSize: 12 }}>
                      Total Paid
                    </span>
                  </div>
                  <span style={{ color: "#1C1F33", fontSize: 16 }}>·</span>
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 4 }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#fbbf24",
                        fontSize: 18,
                        fontFamily: "monospace",
                      }}
                    >
                      {stripeData && (stripeData.payouts ?? []).length > 0
                        ? formatCents(
                            (stripeData.payouts ?? [])
                              .filter((p) => p.status === "in_transit")
                              .reduce((s, p) => s + p.amount, 0),
                          )
                        : "—"}
                    </span>
                    <span style={{ color: "#7A7D90", fontSize: 12 }}>
                      In Transit
                    </span>
                  </div>
                </div>
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
          <input
            data-ocid="orders.email_search_input"
            type="text"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            placeholder="Search by email…"
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          />
          <select
            data-ocid="orders.service_type_filter.select"
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            style={{
              ...inputStyle,
              paddingRight: 32,
              cursor: "pointer",
              minWidth: 160,
              appearance: "auto",
            }}
          >
            <option value="">All Service Types</option>
            {serviceTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {(emailSearch !== "" || serviceTypeFilter !== "") && (
            <button
              type="button"
              data-ocid="orders.clear_filters.button"
              onClick={() => {
                setEmailSearch("");
                setServiceTypeFilter("");
              }}
              style={{
                border: "1px solid #1C1F33",
                borderRadius: 6,
                padding: "0 12px",
                height: 42,
                fontSize: 13,
                fontWeight: 700,
                color: "#7A7D90",
                background: "transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Clear Filters
            </button>
          )}
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
            data-ocid="orders.refresh.button"
            onClick={() => fetchOrders()}
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
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            data-ocid="orders.export_cart_csv.button"
            onClick={() => exportCartOrdersCSV(filtered)}
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
                      "Amount",
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
                  {paginatedOrders.map((order, idx) => {
                    const clientIdStr = order.client_id?.toString?.() ?? "";
                    // O(1) lookup in principal-keyed map resolved by getClientByPrincipal
                    const info = principalToClient.get(clientIdStr);
                    const rowIdx = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    const isExpanded = expandedOrderId === order.id;
                    return (
                      <>
                        <OrderRow
                          key={order.id.toString()}
                          order={order}
                          info={info}
                          index={rowIdx}
                          actor={actor}
                          onStatusChange={handleStatusChange}
                          isExpanded={isExpanded}
                          onToggleExpand={(id) =>
                            setExpandedOrderId((prev) =>
                              prev === id ? null : id,
                            )
                          }
                        />
                        {isExpanded && (
                          <tr key={`${order.id.toString()}-expand`}>
                            <td
                              colSpan={9}
                              style={{
                                padding: 0,
                                background: "rgba(10,11,22,0.5)",
                                borderTop: "1px solid rgba(94,240,138,0.15)",
                                borderBottom: "1px solid rgba(94,240,138,0.15)",
                              }}
                            >
                              <OrderTimeline
                                order={order}
                                actor={actor}
                                onStatusChange={handleStatusChange}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination controls ───────────────────────────────────────── */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div
              data-ocid="orders.pagination"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 16,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, color: "#7A7D90" }}>
                Showing {paginationStart}–{paginationEnd} of {filtered.length}{" "}
                orders
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  data-ocid="orders.pagination_prev"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "5px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: currentPage === 1 ? "#3A3D50" : "#EEF0F8",
                    background: "rgba(19,21,36,1)",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>
                <span
                  style={{ fontSize: 12, color: "#EEF0F8", fontWeight: 600 }}
                >
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  data-ocid="orders.pagination_next"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={{
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "5px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: currentPage === totalPages ? "#3A3D50" : "#EEF0F8",
                    background: "rgba(19,21,36,1)",
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
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
          {/* Mobile hamburger — shown only below 768px */}
          <div
            className="orders-tab-mobile-header"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid #1C1F33",
              background: "rgba(19,21,36,0.5)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#EEF0F8" }}>
              {tabsConfig.find((t) => t.key === activeTab)?.label ??
                "Transactions"}
            </span>
            <button
              type="button"
              data-ocid="orders.tab.hamburger_button"
              aria-label="Open transaction tabs menu"
              onClick={() => setTabMenuOpen(true)}
              style={{
                background: "transparent",
                border: "1px solid #1C1F33",
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
                color: "#EEF0F8",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ☰
            </button>
          </div>

          {/* Desktop tab row — hidden below 768px */}
          <div
            className="orders-tab-desktop-row tabs-scroll-container"
            style={{
              display: "flex",
              borderBottom: "1px solid #1C1F33",
              background: "rgba(19,21,36,0.5)",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none" as CSSProperties["scrollbarWidth"],
              msOverflowStyle: "none" as CSSProperties["msOverflowStyle"],
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

          {/* Mobile fullscreen overlay */}
          {tabMenuOpen && (
            <div
              data-ocid="orders.tab.mobile_overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 9999,
                background: "rgba(10,11,22,0.97)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Overlay header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 20px",
                  borderBottom: "1px solid #1C1F33",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#EEF0F8" }}
                >
                  Transactions
                </span>
                <button
                  type="button"
                  data-ocid="orders.tab.mobile_overlay_close"
                  aria-label="Close transaction tabs menu"
                  onClick={() => setTabMenuOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid #1C1F33",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "#EEF0F8",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
              {/* Tab list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                {tabsConfig.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    data-ocid={`orders.tab.mobile.${key}`}
                    onClick={() => {
                      setActiveTab(key);
                      setTabMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      minHeight: 52,
                      padding: "0 24px",
                      background:
                        activeTab === key
                          ? "rgba(94,240,138,0.08)"
                          : "transparent",
                      border: "none",
                      borderLeft:
                        activeTab === key
                          ? "3px solid #5EF08A"
                          : "3px solid transparent",
                      cursor: "pointer",
                      fontSize: 15,
                      fontWeight: activeTab === key ? 700 : 500,
                      color: activeTab === key ? "#5EF08A" : "#EEF0F8",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            {activeTab === "payouts" && (
              <PayoutsTab payouts={stripeData?.payouts ?? []} />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
