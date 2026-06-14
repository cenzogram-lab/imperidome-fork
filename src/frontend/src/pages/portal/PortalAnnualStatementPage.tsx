import { Skeleton } from "@/components/ui/skeleton";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import type { BillingHistory, Order, backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  depositReceived: "Deposit Received",
  cancelled: "Cancelled",
  draftReady: "Draft Ready",
  questionnaireComplete: "Questionnaire Complete",
  live: "Active",
  buildInProgress: "Build In Progress",
  revisionsInProgress: "Revisions In Progress",
  questionnairePending: "Questionnaire Pending",
  launching: "Launching",
  paused: "Paused",
  depositSent: "Deposit Sent",
};

function getOrderStatusLabel(status: Order["status"]): string {
  const key =
    typeof status === "object" && status !== null
      ? Object.keys(status as Record<string, unknown>)[0]
      : String(status);
  return ORDER_STATUS_LABELS[key ?? ""] ?? key ?? String(status);
}

function getStatusBadgeClass(status: string): string {
  const lower = status.toLowerCase();
  if (
    lower === "paid" ||
    lower === "live" ||
    lower === "depositreceived" ||
    lower === "completed" ||
    lower === "questionnairecomplete"
  ) {
    return "matrix-badge";
  }
  if (lower === "failed" || lower === "cancelled" || lower === "paused") {
    return "matrix-badge matrix-badge-red";
  }
  return "matrix-badge";
}

interface StatementRow {
  kind: "order" | "billing";
  date: bigint;
  description: string;
  type: "Order" | "Subscription Payment";
  amount: number | null;
  status: string;
}

export default function PortalAnnualStatementPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<
    "all" | "orders" | "billing"
  >("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">(
    "all",
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const hasDateRange = fromDate !== "" || toDate !== "";

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    if (!actor) return;
    (actor as unknown as { getAdminContactEmail(): Promise<string> })
      .getAdminContactEmail()
      .then((email: string) => {
        if (email) {
          const domain = email.split("@")[1] ?? "";
          setBrandName(domain.split(".")[0]?.toUpperCase() ?? "");
        }
      })
      .catch(() => {});
  }, [actor]);

  const loadData = useCallback(async () => {
    if (!actor || !userEmail) return;
    setLoading(true);
    setFetchError(null);
    try {
      const a = actor as backendInterface;
      const [orderList, billingList] = await Promise.all([
        a.getMyOrders(),
        a.getMyBillingHistory(),
      ]);
      setOrders(orderList);
      setBillingHistory(billingList);
    } catch (err) {
      setFetchError(
        err instanceof Error
          ? err.message
          : "Failed to load billing history. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [actor, userEmail]);

  useEffect(() => {
    if (!actor || isFetching) return;
    void loadData();
  }, [actor, isFetching, loadData]);

  const yearFilteredOrders = orders.filter((o) => {
    const ms = Number(o.created_at) / 1_000_000;
    if (hasDateRange) {
      const dateStr = new Date(ms).toISOString().split("T")[0];
      if (fromDate && dateStr < fromDate) return false;
      if (toDate && dateStr > toDate) return false;
      return true;
    }
    return new Date(ms).getFullYear() === selectedYear;
  });

  const yearFilteredBilling = billingHistory.filter((b) => {
    const ms = Number(b.payment_date) / 1_000_000;
    if (hasDateRange) {
      const dateStr = new Date(ms).toISOString().split("T")[0];
      if (fromDate && dateStr < fromDate) return false;
      if (toDate && dateStr > toDate) return false;
      return true;
    }
    return new Date(ms).getFullYear() === selectedYear;
  });

  const combinedRows: StatementRow[] = [
    ...yearFilteredOrders.map(
      (o): StatementRow => ({
        kind: "order",
        date: o.created_at,
        description: o.tier_code || "Order",
        type: "Order",
        amount: o.amount,
        status: getOrderStatusLabel(o.status),
      }),
    ),
    ...yearFilteredBilling.map(
      (b): StatementRow => ({
        kind: "billing",
        date: b.payment_date,
        description: b.description || "Subscription",
        type: "Subscription Payment",
        amount: b.amount,
        status: b.status,
      }),
    ),
  ].sort((a2, b2) => {
    const da = a2.date;
    const db = b2.date;
    return db > da ? 1 : db < da ? -1 : 0;
  });

  const PAID_STATUS_KEYS = new Set([
    "paid",
    "live",
    "depositreceived",
    "completed",
    "questionnairecomplete",
  ]);

  function isRowPaid(row: StatementRow): boolean {
    return PAID_STATUS_KEYS.has(row.status.toLowerCase());
  }

  const rows = combinedRows.filter((row) => {
    if (transactionTypeFilter !== "all") {
      if (transactionTypeFilter === "orders" && row.kind !== "order")
        return false;
      if (transactionTypeFilter === "billing" && row.kind !== "billing")
        return false;
    }
    if (statusFilter === "paid" && !isRowPaid(row)) return false;
    if (statusFilter === "pending" && isRowPaid(row)) return false;
    return true;
  });

  const totalPaid = rows
    .filter((r) => r.kind === "billing")
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const transactionCount = rows.length;

  // Full-year totals by type (always unaffected by the type filter)
  const ordersWithZeroAmount: number = yearFilteredOrders.filter(
    (o) => o.amount === 0 || o.amount === 0.0,
  ).length;
  const ordersYearTotal: number = yearFilteredOrders.reduce(
    (sum, o) => sum + o.amount,
    0,
  );
  const subscriptionYearTotal: number = yearFilteredBilling.reduce(
    (sum, b) => sum + b.amount,
    0,
  );

  // Current year total respecting the active type filter (for YoY delta)
  const currentYearTotal: number = (() => {
    if (transactionTypeFilter === "orders") {
      return yearFilteredOrders.reduce(
        (sum, o) => sum + (o.amount > 0 ? o.amount : 0),
        0,
      );
    }
    if (transactionTypeFilter === "billing") {
      return yearFilteredBilling.reduce((sum, b) => sum + b.amount, 0);
    }
    return (
      yearFilteredOrders.reduce(
        (sum, o) => sum + (o.amount > 0 ? o.amount : 0),
        0,
      ) + yearFilteredBilling.reduce((sum, b) => sum + b.amount, 0)
    );
  })();

  // Prior year derived data (client-side only, no new backend calls)
  const priorYear = selectedYear - 1;

  const priorYearOrders = orders.filter((o) => {
    const ms = Number(o.created_at) / 1_000_000;
    return new Date(ms).getFullYear() === priorYear;
  });

  const priorYearBilling = billingHistory.filter((b) => {
    const ms = Number(b.payment_date) / 1_000_000;
    return new Date(ms).getFullYear() === priorYear;
  });

  const priorYearTotal: number = (() => {
    if (transactionTypeFilter === "orders") {
      return priorYearOrders.reduce(
        (sum, o) => sum + (o.amount > 0 ? o.amount : 0),
        0,
      );
    }
    if (transactionTypeFilter === "billing") {
      return priorYearBilling.reduce((sum, b) => sum + b.amount, 0);
    }
    const ordersSum = priorYearOrders.reduce(
      (sum, o) => sum + (o.amount > 0 ? o.amount : 0),
      0,
    );
    const billingSum = priorYearBilling.reduce((sum, b) => sum + b.amount, 0);
    return ordersSum + billingSum;
  })();

  const priorYearCount: number = (() => {
    if (transactionTypeFilter === "orders") return priorYearOrders.length;
    if (transactionTypeFilter === "billing") return priorYearBilling.length;
    return priorYearOrders.length + priorYearBilling.length;
  })();

  const delta = currentYearTotal - priorYearTotal;

  const sectionCard: CSSProperties = {
    background: "rgba(10,11,20,0.9)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid rgba(94,240,138,0.15)",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "24px",
  };

  return (
    <PortalLayout pageTitle="Annual Statement">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .yoy-comparison { display: none !important; }
          .yoy-toggle { display: none !important; }
          .date-range-picker { display: none !important; }
          .print-filter-label { display: block !important; }
          aside[data-ocid="portal.sidebar.panel"],
          nav[data-ocid="portal.tab_bar.panel"],
          header[data-ocid="portal.header.panel"] {
            display: none !important;
          }
          body { background: white !important; color: black !important; }
          .print-header { display: block !important; }
          .print-only { display: block !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; color: black !important; background: white !important; }
          th { background: #f5f5f5 !important; font-weight: 700; }
        }
        @media screen {
          .print-header { display: none; }
          .print-only { display: none; }
          .print-filter-label { display: none; }
        }
      `}</style>

      <div
        data-ocid="portal.annual_statement.page"
        style={{ width: "100%", padding: "0 0 40px 0" }}
      >
        {/* Print header */}
        <div className="print-header" style={{ marginBottom: "24px" }}>
          <h1
            style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}
          >
            {brandName || "Company Name"}
          </h1>
          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}
          >
            Annual Billing Statement
          </h2>
          <p style={{ fontSize: "14px", marginBottom: "4px" }}>
            Year: {selectedYear}
          </p>
          <p style={{ fontSize: "14px" }}>Client: {userEmail}</p>
          {transactionTypeFilter !== "all" && (
            <p
              className="print-filter-label"
              style={{ fontSize: "13px", marginTop: "4px", color: "#333" }}
            >
              {transactionTypeFilter === "orders"
                ? "Showing: Orders only"
                : "Showing: Subscription payments only"}
            </p>
          )}
          {statusFilter !== "all" && (
            <p
              className="print-filter-label"
              style={{ fontSize: "13px", marginTop: "2px", color: "#333" }}
            >
              Status: {statusFilter === "paid" ? "Paid" : "Pending"}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Annual Billing Statement
          </h1>
          <div
            className="no-print"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              flexWrap: "wrap",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                data-ocid="annual_statement.year_select"
                style={{
                  background: "rgba(10,11,20,0.95)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  padding: "6px 12px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={transactionTypeFilter}
                onChange={(e) =>
                  setTransactionTypeFilter(
                    e.target.value as "all" | "orders" | "billing",
                  )
                }
                data-ocid="annual_statement.type_filter_select"
                style={{
                  background: "rgba(10,11,20,0.95)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  padding: "6px 12px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              >
                <option value="all">All</option>
                <option value="orders">Orders only</option>
                <option value="billing">Subscription payments only</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "paid" | "pending")
                }
                data-ocid="annual_statement.status_filter_select"
                style={{
                  background: "rgba(10,11,20,0.95)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  padding: "6px 12px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              >
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            {/* Date range picker */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "rgba(224,224,224,0.5)",
                  whiteSpace: "nowrap",
                }}
              >
                From
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-ocid="annual_statement.from_date_input"
                style={{
                  background: "rgba(10,11,20,0.95)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  padding: "5px 10px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "rgba(224,224,224,0.5)",
                  whiteSpace: "nowrap",
                }}
              >
                To
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-ocid="annual_statement.to_date_input"
                style={{
                  background: "rgba(10,11,20,0.95)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  padding: "5px 10px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
              {hasDateRange && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  data-ocid="annual_statement.clear_date_range_button"
                  style={{
                    background: "rgba(94,240,138,0.08)",
                    border: "1px solid rgba(94,240,138,0.25)",
                    borderRadius: "4px",
                    color: "#5ef08a",
                    fontSize: "12px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Clear
                </button>
              )}
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(224,224,224,0.35)",
                  fontStyle: "italic",
                  whiteSpace: "nowrap",
                }}
              >
                Custom range overrides year filter
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div data-ocid="annual_statement.loading_state">
            <div style={sectionCard}>
              <Skeleton
                style={{ height: "22px", width: "180px", marginBottom: "20px" }}
              />
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  style={{ height: "48px", marginBottom: "8px" }}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && fetchError && (
          <div
            data-ocid="annual_statement.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "20px 24px",
              color: "#EF4444",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            {fetchError}
          </div>
        )}

        {!loading && !fetchError && transactionCount === 0 && (
          <div
            data-ocid="annual_statement.empty_state"
            style={{
              ...sectionCard,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "120px",
              color: "rgba(224,224,224,0.5)",
              fontSize: "15px",
            }}
          >
            {(() => {
              const yearLabel = hasDateRange
                ? "the selected date range"
                : String(selectedYear);
              const typeLabel =
                transactionTypeFilter === "orders"
                  ? "orders"
                  : transactionTypeFilter === "billing"
                    ? "subscription payments"
                    : "transactions";
              const statusLabel =
                statusFilter === "paid"
                  ? " (paid)"
                  : statusFilter === "pending"
                    ? " (pending)"
                    : "";
              return `No ${typeLabel}${statusLabel} found for ${yearLabel}.`;
            })()}
          </div>
        )}

        {!loading && !fetchError && transactionCount > 0 && (
          <>
            {/* Summary */}
            <div
              style={{
                ...sectionCard,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(224,224,224,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  Year
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#5ef08a",
                  }}
                >
                  {selectedYear}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(224,224,224,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  Total Paid
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#5ef08a",
                  }}
                >
                  ${formatAmount(totalPaid)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(224,224,224,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  Transactions
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#5ef08a",
                  }}
                >
                  {transactionCount}
                </div>
              </div>
            </div>

            {/* Totals-by-type breakdown */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "24px",
              }}
              data-ocid="annual_statement.type_totals_row"
            >
              <div
                style={{
                  background: "rgba(10,11,20,0.9)",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  border: "1px solid rgba(94,240,138,0.15)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(224,224,224,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  Orders
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#5ef08a",
                  }}
                >
                  ${formatAmount(ordersYearTotal)}
                </div>
                {ordersWithZeroAmount > 0 && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(224,224,224,0.45)",
                      marginTop: "4px",
                    }}
                  >
                    ({ordersWithZeroAmount} order
                    {ordersWithZeroAmount !== 1 ? "s" : ""} not included —
                    legacy records)
                  </div>
                )}
              </div>
              <div
                style={{
                  background: "rgba(10,11,20,0.9)",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  border: "1px solid rgba(94,240,138,0.15)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(224,224,224,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  Subscription Payments
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#5ef08a",
                  }}
                >
                  ${formatAmount(subscriptionYearTotal)}
                </div>
              </div>
            </div>

            {/* Year-over-year comparison toggle */}
            <div
              className="yoy-toggle no-print"
              style={{ marginBottom: "16px" }}
            >
              <button
                type="button"
                className="matrix-btn matrix-btn-outline"
                style={{ fontSize: "13px", padding: "6px 16px" }}
                onClick={() => setShowComparison((prev) => !prev)}
                data-ocid="annual_statement.yoy_toggle"
                aria-label={
                  showComparison
                    ? "Hide prior year comparison"
                    : "Compare to prior year"
                }
              >
                {showComparison
                  ? "Hide prior year comparison"
                  : `Compare to ${priorYear}`}
              </button>
            </div>

            {/* Year-over-year comparison section */}
            {showComparison && (
              <div
                className="yoy-comparison"
                style={{ marginBottom: "24px" }}
                data-ocid="annual_statement.yoy_comparison"
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(224,224,224,0.5)",
                    textTransform: "uppercase" as const,
                    letterSpacing: "1px",
                    marginBottom: "12px",
                  }}
                >
                  Prior Year Comparison — {priorYear}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                  }}
                >
                  {/* Prior year total paid */}
                  <div
                    style={{
                      background: "rgba(10,11,20,0.9)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      border: "1px solid rgba(94,240,138,0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(224,224,224,0.6)",
                        textTransform: "uppercase" as const,
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}
                    >
                      {priorYear} Total Paid
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#ffffff",
                      }}
                    >
                      ${formatAmount(priorYearTotal)}
                    </div>
                  </div>

                  {/* Prior year transaction count */}
                  <div
                    style={{
                      background: "rgba(10,11,20,0.9)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      border: "1px solid rgba(94,240,138,0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(224,224,224,0.6)",
                        textTransform: "uppercase" as const,
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}
                    >
                      {priorYear} Transactions
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#ffffff",
                      }}
                    >
                      {priorYearCount}
                    </div>
                  </div>

                  {/* Delta card */}
                  <div
                    style={{
                      background: "rgba(10,11,20,0.9)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      border: "1px solid rgba(94,240,138,0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(224,224,224,0.6)",
                        textTransform: "uppercase" as const,
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}
                    >
                      vs {priorYear}
                    </div>
                    {delta !== 0 ? (
                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: 700,
                          color: delta > 0 ? "#4ade80" : "#f87171",
                        }}
                      >
                        {delta > 0 ? "+" : "-"}${Math.abs(delta).toFixed(2)}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "rgba(224,224,224,0.4)",
                          paddingTop: "4px",
                        }}
                      >
                        No change
                      </div>
                    )}

                    {/* Per-type breakdown sub-rows */}
                    {(() => {
                      const curOrdersTotal = orders
                        .filter((o) => {
                          const ms = Number(o.created_at) / 1_000_000;
                          return (
                            new Date(ms).getFullYear() === selectedYear &&
                            o.amount > 0
                          );
                        })
                        .reduce((s, o) => s + o.amount, 0);
                      const curBillingTotal = billingHistory
                        .filter((b) => {
                          const ms = Number(b.payment_date) / 1_000_000;
                          return new Date(ms).getFullYear() === selectedYear;
                        })
                        .reduce((s, b) => s + b.amount, 0);
                      const prevOrdersTotal = orders
                        .filter((o) => {
                          const ms = Number(o.created_at) / 1_000_000;
                          return (
                            new Date(ms).getFullYear() === priorYear &&
                            o.amount > 0
                          );
                        })
                        .reduce((s, o) => s + o.amount, 0);
                      const prevBillingTotal = billingHistory
                        .filter((b) => {
                          const ms = Number(b.payment_date) / 1_000_000;
                          return new Date(ms).getFullYear() === priorYear;
                        })
                        .reduce((s, b) => s + b.amount, 0);

                      const showOrders =
                        transactionTypeFilter === "all" ||
                        transactionTypeFilter === "orders";
                      const showBilling =
                        transactionTypeFilter === "all" ||
                        transactionTypeFilter === "billing";

                      const subRowStyle: CSSProperties = {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(94,240,138,0.1)",
                        fontSize: "12px",
                      };

                      return (
                        <div style={{ marginTop: "4px" }}>
                          {showOrders && (
                            <div style={subRowStyle}>
                              <span
                                style={{
                                  color: "rgba(224,224,224,0.6)",
                                  minWidth: "120px",
                                }}
                              >
                                Orders
                              </span>
                              <span style={{ color: "#e0e0e0" }}>
                                ${curOrdersTotal.toFixed(2)}
                              </span>
                              <span style={{ color: "rgba(224,224,224,0.45)" }}>
                                vs ${prevOrdersTotal.toFixed(2)}
                              </span>
                              {curOrdersTotal - prevOrdersTotal !== 0 && (
                                <span
                                  style={{
                                    color:
                                      curOrdersTotal - prevOrdersTotal > 0
                                        ? "#4ade80"
                                        : "#f87171",
                                    fontWeight: 600,
                                    minWidth: "72px",
                                    textAlign: "right",
                                  }}
                                >
                                  {curOrdersTotal - prevOrdersTotal > 0
                                    ? "+"
                                    : "-"}
                                  $
                                  {Math.abs(
                                    curOrdersTotal - prevOrdersTotal,
                                  ).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                          {showBilling && (
                            <div style={subRowStyle}>
                              <span
                                style={{
                                  color: "rgba(224,224,224,0.6)",
                                  minWidth: "120px",
                                }}
                              >
                                Subscription Payments
                              </span>
                              <span style={{ color: "#e0e0e0" }}>
                                ${curBillingTotal.toFixed(2)}
                              </span>
                              <span style={{ color: "rgba(224,224,224,0.45)" }}>
                                vs ${prevBillingTotal.toFixed(2)}
                              </span>
                              {curBillingTotal - prevBillingTotal !== 0 && (
                                <span
                                  style={{
                                    color:
                                      curBillingTotal - prevBillingTotal > 0
                                        ? "#4ade80"
                                        : "#f87171",
                                    fontWeight: 600,
                                    minWidth: "72px",
                                    textAlign: "right",
                                  }}
                                >
                                  {curBillingTotal - prevBillingTotal > 0
                                    ? "+"
                                    : "-"}
                                  $
                                  {Math.abs(
                                    curBillingTotal - prevBillingTotal,
                                  ).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction table */}
            <div
              style={sectionCard}
              data-ocid="annual_statement.transactions_table"
            >
              <div style={{ overflowX: "auto" }}>
                <table className="matrix-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const dateStr = formatDate(row.date);
                      const amountDisplay =
                        row.amount !== null
                          ? `$${formatAmount(row.amount)}`
                          : "—";
                      const badgeClass = getStatusBadgeClass(row.status);
                      return (
                        <tr key={`${row.kind}-${idx}`}>
                          <td style={{ whiteSpace: "nowrap" }}>{dateStr}</td>
                          <td>{row.description}</td>
                          <td>{row.type}</td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {amountDisplay}
                          </td>
                          <td>
                            <span className={badgeClass}>{row.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print + CSV buttons */}
            <div
              className="no-print"
              style={{
                marginTop: "24px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="matrix-btn matrix-btn-outline"
                style={{ fontSize: "13px", padding: "6px 16px" }}
                onClick={() => {
                  const typePart =
                    transactionTypeFilter === "orders"
                      ? "Orders only"
                      : transactionTypeFilter === "billing"
                        ? "Subscription Payments"
                        : null;
                  const statusPart =
                    statusFilter === "paid"
                      ? "Paid"
                      : statusFilter === "pending"
                        ? "Pending"
                        : null;
                  const rangeLabel = hasDateRange
                    ? ` (${fromDate || "start"} to ${toDate || "end"})`
                    : "";
                  const parts = [
                    `Annual Statement ${selectedYear}${rangeLabel}`,
                    typePart,
                    statusPart,
                  ].filter((p): p is string => p !== null);
                  const originalTitle = document.title;
                  document.title = parts.join(" - ");
                  window.print();
                  document.title = originalTitle;
                }}
                data-ocid="annual_statement.print_button"
                aria-label="Print or save as PDF"
              >
                Print / Save as PDF
              </button>
              <button
                type="button"
                className="matrix-btn-outline"
                style={{
                  fontSize: "13px",
                  padding: "6px 16px",
                  fontWeight: 600,
                }}
                data-ocid="annual_statement.csv_button"
                aria-label="Download CSV"
                onClick={() => {
                  function csvCell(val: string): string {
                    if (
                      val.includes(",") ||
                      val.includes('"') ||
                      val.includes("\n")
                    ) {
                      return `"${val.replace(/"/g, '""')}"`;
                    }
                    return val;
                  }
                  const header = [
                    "Date",
                    "Description",
                    "Amount",
                    "Status",
                    "Type",
                  ];
                  const dataRows = rows.map((row) => [
                    csvCell(formatDate(row.date)),
                    csvCell(row.description),
                    csvCell(
                      row.amount !== null ? `${formatAmount(row.amount)}` : "—",
                    ),
                    csvCell(row.status),
                    csvCell(row.type),
                  ]);
                  const totalRowCells = [
                    csvCell("Annual Total"),
                    csvCell(""),
                    csvCell(`${formatAmount(currentYearTotal)}`),
                    csvCell(""),
                    csvCell(""),
                  ];
                  const allRows = [header, ...dataRows, totalRowCells];
                  const csvContent = allRows.map((r) => r.join(",")).join("\n");
                  const blob = new Blob([csvContent], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `annual-statement-${selectedYear}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
              >
                Download CSV
              </button>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
