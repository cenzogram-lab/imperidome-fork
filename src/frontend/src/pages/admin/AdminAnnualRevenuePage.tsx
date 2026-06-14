import { BarChart2, ChevronDown, ChevronUp, Download, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import type { BillingHistory, Order, backendInterface } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import AdminLayout from "./AdminLayout";

const STATUS_LABELS: Record<string, string> = {
  depositReceived: "Deposit Received",
  cancelled: "Cancelled",
  draftReady: "Draft Ready",
  questionnaireComplete: "Questionnaire Complete",
  live: "Live",
  buildInProgress: "Build In Progress",
  revisionsInProgress: "Revisions In Progress",
  questionnairePending: "Questionnaire Pending",
  launching: "Launching",
  paused: "Paused",
  depositSent: "Deposit Sent",
};

const STATUS_FILTER_LABELS: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
};

function getYear(ts: bigint): number {
  return new Date(Number(ts / 1_000_000n)).getFullYear();
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toISOString().split("T")[0];
}

function getStatusKey(status: Order["status"]): string {
  return String(status);
}

function getStatusLabel(status: Order["status"]): string {
  const key = getStatusKey(status);
  return STATUS_LABELS[key] ?? key;
}

const cardStyle: React.CSSProperties = {
  background: "rgba(20,22,40,0.7)",
  border: "1px solid rgba(94,240,138,0.13)",
  borderRadius: 12,
  padding: "20px 24px",
};

const tableHeaderStyle: React.CSSProperties = {
  background: "rgba(28,31,51,0.8)",
  color: "#7A7D90",
  fontWeight: 600,
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  padding: "10px 14px",
  borderBottom: "1px solid rgba(94,240,138,0.1)",
  textAlign: "left" as const,
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(94,240,138,0.07)",
  color: "#EEF0F8",
  fontSize: 14,
};

export default function AdminAnnualRevenuePage() {
  const { actor } = useActor();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [billingHistoryLoading, setBillingHistoryLoading] = useState(false);
  const [billingHistoryError, setBillingHistoryError] = useState<string | null>(
    null,
  );
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [globalTaxRate, setGlobalTaxRateValue] = useState<number>(0);
  const [taxRateLoading, setTaxRateLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "orders" | "billing">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">(
    "all",
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [emailSearch, setEmailSearch] = useState<string>("");

  const hasDateRange = fromDate !== "" || toDate !== "";

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!actor) {
        setError("Actor not available. Please try again.");
        setLoading(false);
        return;
      }
      const result = await (actor as backendInterface).getAdminAllOrders();
      setAllOrders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  const fetchBillingHistory = useCallback(async () => {
    if (!actor) return;
    setBillingHistoryLoading(true);
    setBillingHistoryError(null);
    try {
      const result = await (actor as backendInterface).getAdminBillingHistory();
      if (result.__kind__ === "ok") {
        setBillingHistory(result.ok);
      } else {
        setBillingHistoryError(result.err);
      }
    } catch (e) {
      setBillingHistoryError(
        e instanceof Error ? e.message : "Failed to load billing history",
      );
    } finally {
      setBillingHistoryLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    void fetchOrders();
    void fetchBillingHistory();
    setTaxRateLoading(true);
    if (actor) {
      (actor as backendInterface)
        .getGlobalTaxRate()
        .then((rate: number) => {
          setGlobalTaxRateValue(rate);
          setTaxRateLoading(false);
        })
        .catch(() => {
          setTaxRateLoading(false);
        });
    } else {
      setTaxRateLoading(false);
    }
  }, [fetchOrders, fetchBillingHistory, actor]);

  // Paid status keys (per learning: use String(status) to get key)
  const PAID_STATUSES = new Set(["live", "completed"]);

  function isStatusPaid(status: Order["status"]): boolean {
    return PAID_STATUSES.has(String(status));
  }

  const yearOrders = allOrders.filter((o) => {
    if (hasDateRange) {
      const dateStr = formatDate(o.created_at);
      if (fromDate && dateStr < fromDate) return false;
      if (toDate && dateStr > toDate) return false;
      return true;
    }
    return getYear(o.created_at) === selectedYear;
  });

  // For summary cards — always full year, unaffected by type/status filters
  const yearOrdersForSummary = allOrders.filter((o) => {
    if (hasDateRange) {
      const dateStr = formatDate(o.created_at);
      if (fromDate && dateStr < fromDate) return false;
      if (toDate && dateStr > toDate) return false;
      return true;
    }
    return getYear(o.created_at) === selectedYear;
  });
  const yearOrdersWithAmount = yearOrdersForSummary.filter(
    (o) => o.amount > 0.0,
  );
  const totalRevenue = yearOrdersWithAmount.reduce(
    (sum, o) => sum + o.amount,
    0,
  );

  // Prior year (always year-based, unaffected by date range)
  const priorYearOrders = allOrders.filter(
    (o) => getYear(o.created_at) === selectedYear - 1,
  );

  // Apply type + status + email filters to get visible rows
  // typeFilter: 'orders' = orders only, 'billing' = billing history only (none available at admin scope)
  // statusFilter: 'paid' = live/completed, 'pending' = others
  const emailSearchLower = emailSearch.trim().toLowerCase();
  const filteredOrders = yearOrders.filter((o) => {
    if (typeFilter === "billing") return false; // no billing rows in admin scope
    if (statusFilter === "paid" && !isStatusPaid(o.status)) return false;
    if (statusFilter === "pending" && isStatusPaid(o.status)) return false;
    if (emailSearchLower) {
      const clientIdStr = o.client_id.toString().toLowerCase();
      if (!clientIdStr.includes(emailSearchLower)) return false;
    }
    return true;
  });

  const sortedYearOrders = [...filteredOrders].sort((a, b) =>
    b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0,
  );

  // Filtered revenue and count for summary updates
  const filteredRevenue = filteredOrders
    .filter((o) => o.amount > 0)
    .reduce((sum, o) => sum + o.amount, 0);
  const filteredCount = filteredOrders.length;

  // YoY prior year respecting type filter (status filter not applied to YoY for prior year)
  const priorYearFiltered = priorYearOrders.filter((_o) => {
    if (typeFilter === "billing") return false;
    return true;
  });
  const priorFilteredRevenue = priorYearFiltered
    .filter((o) => o.amount > 0)
    .reduce((sum, o) => sum + o.amount, 0);

  function getEmptyStateMessage(): string {
    const yearLabel = hasDateRange
      ? "the selected date range"
      : String(selectedYear);
    if (emailSearchLower) {
      return `No orders found for '${emailSearch}' in ${yearLabel}.`;
    }
    if (typeFilter === "billing") {
      return `No subscription payments found for ${yearLabel}.`;
    }
    if (statusFilter === "paid") {
      return `No paid orders found for ${yearLabel}.`;
    }
    if (statusFilter === "pending") {
      return `No pending orders found for ${yearLabel}.`;
    }
    if (hasDateRange) {
      return "No transactions found for the selected date range.";
    }
    return `No transactions found for ${selectedYear}.`;
  }

  function handleExportCSV() {
    const header = [
      "Date",
      "ClientID",
      "Description",
      "Type",
      "Amount",
      "Status",
    ];
    const csvRows = sortedYearOrders.map((o) => [
      formatDate(o.created_at),
      o.client_id.toString(),
      o.tier_code || "",
      "Order",
      o.amount > 0 ? o.amount.toFixed(2) : "0.00",
      getStatusLabel(o.status),
    ]);
    const csv = [header, ...csvRows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-admin-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout pageTitle="Annual Revenue">
      <style>{`
        @media print {
          .admin-date-range-picker { display: none !important; }
          .admin-filter-controls { display: none !important; }
          .admin-print-only { display: block !important; }
        }
        @media screen {
          .admin-print-only { display: none; }
        }
      `}</style>
      <div style={{ minHeight: "100vh", padding: "24px 0" }}>
        {/* Print-only status filter label */}
        {statusFilter !== "all" && (
          <p
            className="admin-print-only"
            style={{ fontSize: 13, marginBottom: 8, color: "#333" }}
          >
            Showing: {STATUS_FILTER_LABELS[statusFilter]} orders only
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart2 size={22} color="#5ef08a" />
            <h1
              style={{
                color: "#EEF0F8",
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Annual Revenue
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              flexDirection: "column",
            }}
          >
            {/* Row 1: Year + Type + Status + Export */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                data-ocid="admin_revenue.year_select"
                style={{
                  background: "rgba(20,22,40,0.9)",
                  border: "1px solid rgba(94,240,138,0.2)",
                  borderRadius: 8,
                  color: "#EEF0F8",
                  padding: "8px 14px",
                  fontSize: 14,
                  cursor: "pointer",
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
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "all" | "orders" | "billing")
                }
                data-ocid="admin_revenue.type_filter_select"
                style={{
                  background: "rgba(20,22,40,0.9)",
                  border: "1px solid rgba(94,240,138,0.2)",
                  borderRadius: 8,
                  color: "#EEF0F8",
                  padding: "8px 14px",
                  fontSize: 14,
                  cursor: "pointer",
                  colorScheme: "dark",
                }}
              >
                <option value="all">All types</option>
                <option value="orders">Orders only</option>
                <option value="billing">Subscription payments only</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "paid" | "pending")
                }
                data-ocid="admin_revenue.status_filter_select"
                style={{
                  background: "rgba(20,22,40,0.9)",
                  border: "1px solid rgba(94,240,138,0.2)",
                  borderRadius: 8,
                  color: "#EEF0F8",
                  padding: "8px 14px",
                  fontSize: 14,
                  cursor: "pointer",
                  colorScheme: "dark",
                }}
              >
                <option value="all">All statuses</option>
                <option value="paid">Paid only</option>
                <option value="pending">Pending only</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const typePart =
                    typeFilter === "orders"
                      ? "Orders only"
                      : typeFilter === "billing"
                        ? "Subscription Payments"
                        : null;
                  const statusPart =
                    statusFilter !== "all"
                      ? STATUS_FILTER_LABELS[statusFilter]
                      : null;
                  const parts = [
                    `Annual Revenue ${hasDateRange ? "(custom range)" : String(selectedYear)}`,
                    typePart,
                    statusPart,
                  ].filter((p): p is string => p !== null);
                  const originalTitle = document.title;
                  document.title = parts.join(" - ");
                  window.print();
                  document.title = originalTitle;
                }}
                data-ocid="admin_revenue.print_button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(94,240,138,0.08)",
                  border: "1px solid rgba(94,240,138,0.25)",
                  borderRadius: 8,
                  color: "#5ef08a",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Print / PDF
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={sortedYearOrders.length === 0}
                data-ocid="admin_revenue.export_csv_button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background:
                    sortedYearOrders.length === 0
                      ? "rgba(94,240,138,0.05)"
                      : "rgba(94,240,138,0.15)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: 8,
                  color: sortedYearOrders.length === 0 ? "#7A7D90" : "#5ef08a",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor:
                    sortedYearOrders.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <Download size={15} />
                Export CSV
              </button>
            </div>
            {/* Row 2: Email search + Date range picker */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Search by client email..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  data-ocid="admin_revenue.email_search_input"
                  style={{
                    background: "rgba(20,22,40,0.9)",
                    border: "1px solid rgba(94,240,138,0.2)",
                    borderRadius: 8,
                    color: "#EEF0F8",
                    padding: emailSearch ? "7px 34px 7px 12px" : "7px 12px",
                    fontSize: 14,
                    outline: "none",
                    colorScheme: "dark",
                    width: 240,
                  }}
                />
                {emailSearch && (
                  <button
                    type="button"
                    onClick={() => setEmailSearch("")}
                    aria-label="Clear email search"
                    data-ocid="admin_revenue.clear_email_search_button"
                    style={{
                      position: "absolute",
                      right: 8,
                      background: "transparent",
                      border: "none",
                      color: "#7A7D90",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span
                style={{ color: "#7A7D90", fontSize: 13, whiteSpace: "nowrap" }}
              >
                From
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-ocid="admin_revenue.from_date_input"
                style={{
                  background: "rgba(20,22,40,0.9)",
                  border: "1px solid rgba(94,240,138,0.2)",
                  borderRadius: 8,
                  color: "#EEF0F8",
                  padding: "7px 12px",
                  fontSize: 14,
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
              <span
                style={{ color: "#7A7D90", fontSize: 13, whiteSpace: "nowrap" }}
              >
                To
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-ocid="admin_revenue.to_date_input"
                style={{
                  background: "rgba(20,22,40,0.9)",
                  border: "1px solid rgba(94,240,138,0.2)",
                  borderRadius: 8,
                  color: "#EEF0F8",
                  padding: "7px 12px",
                  fontSize: 14,
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
                  data-ocid="admin_revenue.clear_date_range_button"
                  style={{
                    background: "rgba(94,240,138,0.08)",
                    border: "1px solid rgba(94,240,138,0.25)",
                    borderRadius: 8,
                    color: "#5ef08a",
                    fontSize: 13,
                    padding: "7px 14px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}
                >
                  Clear
                </button>
              )}
              <span
                style={{
                  color: "#7A7D90",
                  fontSize: 12,
                  fontStyle: "italic",
                  whiteSpace: "nowrap",
                }}
              >
                Custom range overrides year filter
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                color: "#7A7D90",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              {typeFilter === "all" && statusFilter === "all"
                ? "Total Revenue"
                : "Filtered Revenue"}
            </div>
            <div style={{ color: "#5ef08a", fontSize: 28, fontWeight: 700 }}>
              $
              {(typeFilter === "all" && statusFilter === "all"
                ? totalRevenue
                : filteredRevenue
              ).toFixed(2)}
            </div>
            <div style={{ color: "#7A7D90", fontSize: 12, marginTop: 4 }}>
              {typeFilter === "all" && statusFilter === "all"
                ? `${yearOrdersWithAmount.length} paid order${yearOrdersWithAmount.length !== 1 ? "s" : ""}`
                : `${filteredOrders.filter((o) => o.amount > 0).length} order${filteredOrders.filter((o) => o.amount > 0).length !== 1 ? "s" : ""}`}
            </div>
          </div>
          <div style={cardStyle}>
            <div
              style={{
                color: "#7A7D90",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              {typeFilter === "all" && statusFilter === "all"
                ? "Total Orders"
                : "Filtered Orders"}
            </div>
            <div style={{ color: "#EEF0F8", fontSize: 28, fontWeight: 700 }}>
              {typeFilter === "all" && statusFilter === "all"
                ? yearOrdersForSummary.length
                : filteredCount}
            </div>
            <div style={{ color: "#7A7D90", fontSize: 12, marginTop: 4 }}>
              {typeFilter === "all" && statusFilter === "all"
                ? "all statuses"
                : "active filters"}
            </div>
          </div>
          <div style={cardStyle}>
            <div
              style={{
                color: "#7A7D90",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Recurring Revenue
            </div>
            {billingHistoryLoading ? (
              <div style={{ color: "#7A7D90", fontSize: 14 }}>Loading…</div>
            ) : billingHistoryError ? (
              <div style={{ color: "#f87171", fontSize: 13 }}>
                {billingHistoryError}
              </div>
            ) : (
              (() => {
                const filteredBilling = billingHistory.filter((b) => {
                  const dateStr = b.payment_date
                    ? new Date(Number(b.payment_date) / 1_000_000)
                        .toISOString()
                        .split("T")[0]
                    : b.created_at
                      ? new Date(Number(b.created_at) / 1_000_000)
                          .toISOString()
                          .split("T")[0]
                      : "";
                  if (hasDateRange) {
                    if (fromDate && dateStr < fromDate) return false;
                    if (toDate && dateStr > toDate) return false;
                    return true;
                  }
                  const year = b.payment_date
                    ? new Date(Number(b.payment_date) / 1_000_000).getFullYear()
                    : b.created_at
                      ? new Date(Number(b.created_at) / 1_000_000).getFullYear()
                      : 0;
                  return year === selectedYear;
                });
                const recurringTotal = filteredBilling.reduce(
                  (sum, b) => sum + b.amount,
                  0,
                );
                const combinedTotal = totalRevenue + recurringTotal;
                return (
                  <>
                    <div
                      style={{
                        color: "#5ef08a",
                        fontSize: 28,
                        fontWeight: 700,
                      }}
                    >
                      ${recurringTotal.toFixed(2)}
                    </div>
                    <div
                      style={{ color: "#7A7D90", fontSize: 12, marginTop: 4 }}
                    >
                      {filteredBilling.length} subscription payment
                      {filteredBilling.length !== 1 ? "s" : ""}
                    </div>
                    <div
                      style={{
                        color: "#7A7D90",
                        fontSize: 11,
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px solid rgba(94,240,138,0.08)",
                      }}
                    >
                      <span style={{ color: "#B0B3C6", fontWeight: 600 }}>
                        Combined Total:{" "}
                      </span>
                      <span style={{ color: "#EEF0F8", fontWeight: 700 }}>
                        ${combinedTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()
            )}
          </div>
          {/* Tax Collected */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a0a 0%, #0a0a00 100%)",
              border: "1px solid rgba(234,179,8,0.3)",
              borderRadius: 16,
              padding: "24px 28px",
              minWidth: 220,
            }}
          >
            <div
              style={{
                color: "#9ca3af",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Tax Collected
            </div>
            {taxRateLoading ? (
              <div style={{ color: "#6b7280", fontSize: 28, fontWeight: 700 }}>
                —
              </div>
            ) : (
              <div style={{ color: "#eab308", fontSize: 28, fontWeight: 700 }}>
                ${((totalRevenue * globalTaxRate) / 100).toFixed(2)}
              </div>
            )}
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
              At {globalTaxRate.toFixed(2)}% tax rate
            </div>
          </div>
          {/* Revenue After Tax */}
          <div
            style={{
              background: "linear-gradient(135deg, #0a1a0a 0%, #000a00 100%)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 16,
              padding: "24px 28px",
              minWidth: 220,
            }}
          >
            <div
              style={{
                color: "#9ca3af",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}
            >
              Revenue After Tax
            </div>
            {taxRateLoading ? (
              <div style={{ color: "#6b7280", fontSize: 28, fontWeight: 700 }}>
                —
              </div>
            ) : (
              (() => {
                const taxAmt = (totalRevenue * globalTaxRate) / 100;
                return (
                  <div
                    style={{ color: "#22c55e", fontSize: 28, fontWeight: 700 }}
                  >
                    ${(totalRevenue - taxAmt).toFixed(2)}
                  </div>
                );
              })()
            )}
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
              Total revenue minus tax
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid rgba(94,240,138,0.2)",
              borderRadius: 8,
              color: "#5ef08a",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Compare to prior year
            {showComparison ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>

          {showComparison && (
            <div style={{ ...cardStyle, marginTop: 12 }}>
              <div
                style={{
                  color: "#7A7D90",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                vs. {selectedYear - 1}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 32,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{ color: "#7A7D90", fontSize: 12, marginBottom: 2 }}
                  >
                    {selectedYear} Revenue
                  </div>
                  <div
                    style={{ color: "#EEF0F8", fontSize: 20, fontWeight: 700 }}
                  >
                    $
                    {(typeFilter === "billing"
                      ? 0
                      : filteredOrders
                          .filter((o) => o.amount > 0)
                          .reduce((s, o) => s + o.amount, 0)
                    ).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div
                    style={{ color: "#7A7D90", fontSize: 12, marginBottom: 2 }}
                  >
                    {selectedYear - 1} Revenue
                  </div>
                  <div
                    style={{ color: "#EEF0F8", fontSize: 20, fontWeight: 700 }}
                  >
                    ${priorFilteredRevenue.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div
                    style={{ color: "#7A7D90", fontSize: 12, marginBottom: 2 }}
                  >
                    Prior Year Orders
                  </div>
                  <div
                    style={{ color: "#EEF0F8", fontSize: 20, fontWeight: 700 }}
                  >
                    {priorYearFiltered.length}
                  </div>
                </div>
                {(() => {
                  const curRev =
                    typeFilter === "billing"
                      ? 0
                      : filteredOrders
                          .filter((o) => o.amount > 0)
                          .reduce((s, o) => s + o.amount, 0);
                  const delta = curRev - priorFilteredRevenue;
                  return delta !== 0 ? (
                    <div>
                      <div
                        style={{
                          color: "#7A7D90",
                          fontSize: 12,
                          marginBottom: 2,
                        }}
                      >
                        Delta
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: delta >= 0 ? "#5ef08a" : "#f87171",
                        }}
                      >
                        {delta >= 0 ? "+" : "-"}${Math.abs(delta).toFixed(2)}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              {typeFilter !== "billing" && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(94,240,138,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#7A7D90",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 8,
                    }}
                  >
                    Orders Breakdown
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      flexWrap: "wrap",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "rgba(238,240,248,0.7)" }}>
                      {selectedYear}:{" "}
                      <strong style={{ color: "#EEF0F8" }}>
                        $
                        {filteredOrders
                          .filter((o) => o.amount > 0)
                          .reduce((s, o) => s + o.amount, 0)
                          .toFixed(2)}
                      </strong>
                    </span>
                    <span style={{ color: "rgba(238,240,248,0.5)" }}>vs</span>
                    <span style={{ color: "rgba(238,240,248,0.7)" }}>
                      {selectedYear - 1}:{" "}
                      <strong style={{ color: "#EEF0F8" }}>
                        ${priorFilteredRevenue.toFixed(2)}
                      </strong>
                    </span>
                    {(() => {
                      const curRev = filteredOrders
                        .filter((o) => o.amount > 0)
                        .reduce((s, o) => s + o.amount, 0);
                      const d = curRev - priorFilteredRevenue;
                      return d !== 0 ? (
                        <span
                          style={{
                            color: d > 0 ? "#4ade80" : "#f87171",
                            fontWeight: 600,
                          }}
                        >
                          {d > 0 ? "+" : "-"}${Math.abs(d).toFixed(2)}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div
            style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}
          >
            <div style={{ color: "#7A7D90", fontSize: 16 }}>
              Loading orders...
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 12,
              padding: "20px 24px",
              color: "#f87171",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : sortedYearOrders.length === 0 ? (
          <div
            style={{ ...cardStyle, textAlign: "center", padding: "40px 24px" }}
            data-ocid="admin_revenue.empty_state"
          >
            <div style={{ color: "#7A7D90", fontSize: 16 }}>
              {getEmptyStateMessage()}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(20,22,40,0.7)",
              border: "1px solid rgba(94,240,138,0.1)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Client ID",
                      "Description",
                      "Type",
                      "Amount",
                      "Status",
                    ].map((col) => (
                      <th key={col} style={tableHeaderStyle}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedYearOrders.map((order) => {
                    const statusKey = getStatusKey(order.status);
                    return (
                      <tr
                        key={order.id.toString()}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = "rgba(94,240,138,0.04)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = "transparent";
                        }}
                      >
                        <td style={tableCellStyle}>
                          {formatDate(order.created_at)}
                        </td>
                        <td
                          style={{
                            ...tableCellStyle,
                            color: "#7A7D90",
                            fontSize: 12,
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {order.client_id.toString()}
                        </td>
                        <td style={tableCellStyle}>{order.tier_code || "—"}</td>
                        <td style={{ ...tableCellStyle, color: "#7A7D90" }}>
                          Order
                        </td>
                        <td
                          style={{
                            ...tableCellStyle,
                            color: order.amount > 0 ? "#5ef08a" : "#7A7D90",
                            fontWeight: order.amount > 0 ? 600 : 400,
                          }}
                        >
                          {order.amount > 0
                            ? `$${order.amount.toFixed(2)}`
                            : "—"}
                        </td>
                        <td style={tableCellStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              background:
                                statusKey === "live"
                                  ? "rgba(94,240,138,0.12)"
                                  : statusKey === "cancelled"
                                    ? "rgba(248,113,113,0.12)"
                                    : "rgba(122,125,144,0.15)",
                              color:
                                statusKey === "live"
                                  ? "#5ef08a"
                                  : statusKey === "cancelled"
                                    ? "#f87171"
                                    : "#EEF0F8",
                            }}
                          >
                            {STATUS_LABELS[statusKey] ?? statusKey}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: "12px 14px",
                color: "#7A7D90",
                fontSize: 12,
                borderTop: "1px solid rgba(94,240,138,0.07)",
              }}
            >
              Showing {sortedYearOrders.length} transaction
              {sortedYearOrders.length !== 1 ? "s" : ""}
              {hasDateRange
                ? " for selected date range"
                : ` for ${selectedYear}`}
              {typeFilter !== "all" || statusFilter !== "all"
                ? " (filtered)"
                : ""}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
