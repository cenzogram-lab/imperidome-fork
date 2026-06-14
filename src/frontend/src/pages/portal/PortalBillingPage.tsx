import { Skeleton } from "@/components/ui/skeleton";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import type { BillingHistory, Order } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

type TransactionItem =
  | { kind: "billing"; record: BillingHistory }
  | { kind: "order"; record: Order };

function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBillingAmount(amount: number): string {
  return amount.toFixed(2);
}

function getDescription(item: TransactionItem): string {
  if (item.kind === "billing") {
    return item.record.description || "Subscription";
  }
  return item.record.tier_code || "One-time Order";
}

function getAmountDisplay(item: TransactionItem): string {
  if (item.kind === "billing") {
    return `$${formatBillingAmount(item.record.amount)}`;
  }
  return `$${formatBillingAmount(item.record.amount)}`;
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

function getStatusLabel(item: TransactionItem): string {
  if (item.kind === "billing") {
    return item.record.status;
  }
  const key =
    typeof item.record.status === "object" && item.record.status !== null
      ? Object.keys(item.record.status as Record<string, unknown>)[0]
      : String(item.record.status);
  return ORDER_STATUS_LABELS[key ?? ""] ?? key ?? String(item.record.status);
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
    return "bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium";
  }
  if (lower === "failed" || lower === "cancelled" || lower === "paused") {
    return "bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700";
  }
  return "bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium";
}

function getTransactionDate(item: TransactionItem): bigint {
  if (item.kind === "billing") {
    return item.record.payment_date;
  }
  return item.record.created_at;
}

function getReceiptId(item: TransactionItem, index: number): string {
  if (item.kind === "billing") {
    const pi = item.record.stripe_payment_intent_id;
    return pi ? `REC-${pi.slice(-8).toUpperCase()}` : `REC-${index + 1}`;
  }
  return `REC-${String(item.record.id)}`;
}

function downloadReceiptPDF(
  item: TransactionItem,
  brandName: string,
  brandDomain: string,
  index: number,
): void {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const receiptId = getReceiptId(item, index);
  const dateStr = formatDate(getTransactionDate(item));
  const description = esc(getDescription(item));
  const amount = getAmountDisplay(item);
  const status = esc(getStatusLabel(item));
  const iframeId = "imperidome-receipt-frame";
  const existing = document.getElementById(iframeId);
  if (existing) existing.remove();
  const iframe = document.createElement("iframe");
  iframe.id = iframeId;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;";
  document.body.appendChild(iframe);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Receipt ${esc(receiptId)} — ${esc(brandName)}</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', monospace;
    background: #0a0b14;
    color: #e0e0e0;
    padding: 40px;
    min-height: 100vh;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #0d0f1e;
    border: 1px solid rgba(94,240,138,0.3);
    border-radius: 8px;
    padding: 40px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(94,240,138,0.2);
  }
  .brand-name {
    font-size: 22px;
    font-weight: 700;
    color: #5ef08a;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .brand-domain {
    font-size: 12px;
    color: rgba(224,224,224,0.5);
    margin-top: 4px;
  }
  .receipt-title {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    text-align: right;
  }
  .receipt-id {
    font-size: 12px;
    color: rgba(94,240,138,0.7);
    text-align: right;
    margin-top: 4px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .row:last-child { border-bottom: none; }
  .label {
    font-size: 13px;
    color: rgba(224,224,224,0.6);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .value {
    font-size: 14px;
    color: #e0e0e0;
    font-weight: 500;
    text-align: right;
  }
  .amount-value {
    font-size: 20px;
    font-weight: 700;
    color: #5ef08a;
  }
  .footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(94,240,138,0.2);
    text-align: center;
    font-size: 14px;
    color: rgba(94,240,138,0.8);
    font-style: italic;
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <div class="brand-name">${esc(brandName)}</div>
      <div class="brand-domain">${esc(brandDomain)}</div>
    </div>
    <div>
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-id">${esc(receiptId)}</div>
    </div>
  </div>
  <div class="row">
    <span class="label">Date</span>
    <span class="value">${esc(dateStr)}</span>
  </div>
  <div class="row">
    <span class="label">Description</span>
    <span class="value">${description}</span>
  </div>
  <div class="row">
    <span class="label">Amount</span>
    <span class="value amount-value">${esc(amount)}</span>
  </div>
  <div class="row">
    <span class="label">Status</span>
    <span class="value">${status}</span>
  </div>
  <div class="footer">Thank you for your payment.</div>
</div>
</body>
</html>`;
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setTimeout(() => iframe.remove(), 2000);
  };
}

interface NextStepCard {
  headline: string;
  description: string;
  href: string | null;
}

const NEXT_STEP_CARDS: NextStepCard[] = [
  {
    headline: "Set up autopay",
    description:
      "Link a payment method to keep subscriptions active without manual renewals.",
    href: "/portal/subscriptions",
  },
  {
    headline: "Download your tax summary",
    description: "Export a full year of payments as a CSV for your accountant.",
    href: null,
  },
  {
    headline: "Schedule a billing review",
    description:
      "Book a call to discuss your current plan and any upcoming changes.",
    href: null,
  },
];

const cardStyle: CSSProperties = {
  background: "rgba(10,11,20,0.9)",
  borderRadius: "8px",
  padding: "20px 24px",
  border: "1px solid rgba(94,240,138,0.15)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const linkedCardStyle: CSSProperties = {
  ...cardStyle,
  textDecoration: "none",
  transition: "border-color 0.2s",
};

function SuggestedNextSteps() {
  return (
    <section
      data-ocid="billing.suggested_next_steps.section"
      aria-label="Suggested Next Steps"
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "rgba(224,224,224,0.85)",
          marginBottom: "16px",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        Suggested Next Steps
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {NEXT_STEP_CARDS.map((card) => {
          const headline = (
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#5ef08a",
                display: "block",
              }}
            >
              {card.headline}
            </span>
          );
          const body = (
            <span
              style={{
                fontSize: "13px",
                color: "rgba(224,224,224,0.6)",
                lineHeight: "1.5",
                display: "block",
              }}
            >
              {card.description}
            </span>
          );
          if (card.href !== null) {
            return (
              <a
                key={card.headline}
                href={card.href}
                style={linkedCardStyle}
                data-ocid="billing.suggested_next_steps.item"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    "rgba(94,240,138,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor =
                    "rgba(94,240,138,0.15)";
                }}
              >
                {headline}
                {body}
              </a>
            );
          }
          return (
            <div
              key={card.headline}
              style={cardStyle}
              data-ocid="billing.suggested_next_steps.item"
            >
              {headline}
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatDateISO(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function csvEscape(val: string): string {
  return `"${String(val)
    .replace(/"/g, '""')
    .replace(/[\r\n]+/g, " ")}"`;
}

function exportTransactionsCSV(items: TransactionItem[]): void {
  const todayISO = formatDateISO(BigInt(Date.now()) * 1_000_000n);
  const filename = `transactions-${todayISO}.csv`;
  const header = ["Date", "Description", "Type", "Amount", "Status"];
  const rows = items.map((item) => {
    const date = formatDateISO(getTransactionDate(item));
    const description = getDescription(item);
    const type = item.kind === "billing" ? "Subscription Payment" : "Order";
    const amount = item.record.amount.toFixed(2);
    const status = getStatusLabel(item);
    return [
      csvEscape(date),
      csvEscape(description),
      csvEscape(type),
      csvEscape(amount),
      csvEscape(status),
    ].join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PortalBillingPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [brandWarning, setBrandWarning] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!actor) return;
    (actor as unknown as { getAdminContactEmail(): Promise<string> })
      .getAdminContactEmail()
      .then((email: string) => {
        if (email) {
          const domain = email.split("@")[1] ?? "";
          const name = domain.split(".")[0]?.toUpperCase() ?? "";
          setBrandDomain(domain);
          setBrandName(name || "Your Provider");
          if (!domain.trim() || !name.trim()) {
            setBrandWarning(
              "Brand information could not be loaded. Contact your administrator.",
            );
          }
        } else {
          setBrandWarning(
            "Brand information could not be loaded. Contact your administrator.",
          );
        }
      })
      .catch((err: unknown) => {
        setBrandName("");
        setBrandDomain("");
        setBrandWarning(
          "Brand information could not be loaded. Contact your administrator.",
        );
        console.error("Failed to load brand info:", err);
      });
  }, [actor]);

  const loadData = useCallback(async () => {
    if (!actor || !userEmail) return;
    setLoading(true);
    setFetchError(null);
    try {
      const a = actor as unknown as {
        getMyOrders(): Promise<Array<Order>>;
        getMyBillingHistory(): Promise<Array<BillingHistory>>;
      };
      const [orders, billingRecords] = await Promise.all([
        a.getMyOrders(),
        a.getMyBillingHistory(),
      ]);
      const orderItems: TransactionItem[] = orders.map((record) => ({
        kind: "order" as const,
        record,
      }));
      const billingItems: TransactionItem[] = billingRecords.map((record) => ({
        kind: "billing" as const,
        record,
      }));
      const combined = [...orderItems, ...billingItems].sort((a2, b2) => {
        const da = getTransactionDate(a2);
        const db = getTransactionDate(b2);
        return db > da ? 1 : db < da ? -1 : 0;
      });
      setTransactions(combined);
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

  const filteredTransactions: TransactionItem[] =
    fromDate || toDate
      ? transactions.filter((item) => {
          const iso = formatDateISO(getTransactionDate(item));
          if (fromDate && iso < fromDate) return false;
          if (toDate && iso > toDate) return false;
          return true;
        })
      : transactions;

  const isFiltered = fromDate !== "" || toDate !== "";

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
    <PortalLayout pageTitle="Billing">
      <div
        data-ocid="portal.billing.page"
        style={{ width: "100%", padding: "0 0 40px 0" }}
      >
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
            Billing History
          </h1>
          {!loading && !fetchError && transactions.length > 0 && (
            <button
              type="button"
              className="matrix-btn matrix-btn-outline"
              style={{ fontSize: "13px", padding: "6px 16px" }}
              onClick={() => exportTransactionsCSV(filteredTransactions)}
              data-ocid="billing.export_csv_button"
              aria-label="Export transaction history as CSV"
            >
              Export CSV
            </button>
          )}
        </div>

        {/* ── Date range filter ── */}
        {!loading && !fetchError && transactions.length > 0 && (
          <div
            data-ocid="billing.date_filter.section"
            style={{
              ...sectionCard,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              padding: "16px 20px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "rgba(224,224,224,0.65)",
                whiteSpace: "nowrap",
              }}
            >
              Filter by date:
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  color: "rgba(224,224,224,0.5)",
                  whiteSpace: "nowrap",
                }}
                htmlFor="billing-from-date"
              >
                From
              </label>
              <input
                id="billing-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-ocid="billing.date_filter.from_input"
                style={{
                  background: "rgba(10,11,20,0.95)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  padding: "4px 8px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  color: "rgba(224,224,224,0.5)",
                  whiteSpace: "nowrap",
                }}
                htmlFor="billing-to-date"
              >
                To
              </label>
              <input
                id="billing-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-ocid="billing.date_filter.to_input"
                style={{
                  background: "rgba(10,11,20,0.95)",
                  border: "1px solid rgba(94,240,138,0.3)",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontSize: "13px",
                  padding: "4px 8px",
                  outline: "none",
                  colorScheme: "dark",
                }}
              />
            </div>
            {isFiltered && (
              <button
                type="button"
                className="matrix-btn matrix-btn-outline"
                style={{ fontSize: "12px", padding: "4px 12px" }}
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                data-ocid="billing.date_filter.clear_button"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {loading && (
          <div data-ocid="billing.loading_state">
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
            data-ocid="billing.error_state"
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

        {!loading && !fetchError && transactions.length === 0 && (
          <div
            data-ocid="billing.empty_state"
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
            No billing history found.
          </div>
        )}

        {!loading &&
          !fetchError &&
          transactions.length > 0 &&
          filteredTransactions.length === 0 && (
            <div
              data-ocid="billing.date_filter.empty_state"
              style={{
                ...sectionCard,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100px",
                color: "rgba(224,224,224,0.5)",
                fontSize: "15px",
              }}
            >
              No transactions found for the selected date range.
            </div>
          )}

        {brandWarning && (
          <div
            style={{
              background: "rgba(234,179,8,0.08)",
              border: "1px solid rgba(234,179,8,0.3)",
              borderRadius: "6px",
              padding: "10px 16px",
              marginBottom: "16px",
              color: "#ca8a04",
              fontSize: "13px",
            }}
            data-ocid="billing.brand_warning"
          >
            {brandWarning}
          </div>
        )}

        {!loading && !fetchError && filteredTransactions.length > 0 && (
          <div style={sectionCard} data-ocid="billing.transactions_table">
            <div style={{ overflowX: "auto" }}>
              <table className="matrix-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((item, idx) => {
                    const dateStr = formatDate(getTransactionDate(item));
                    const desc = getDescription(item);
                    const amt = getAmountDisplay(item);
                    const statusLabel = getStatusLabel(item);
                    const badgeClass = getStatusBadgeClass(statusLabel);
                    const rowKey = `${item.kind}-${String(item.record.id)}-${idx}`;
                    return (
                      <tr key={rowKey}>
                        <td style={{ whiteSpace: "nowrap" }}>{dateStr}</td>
                        <td>{desc}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{amt}</td>
                        <td>
                          <span className={badgeClass}>{statusLabel}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="matrix-btn matrix-btn-outline"
                            style={{ fontSize: "12px", padding: "4px 12px" }}
                            onClick={() =>
                              downloadReceiptPDF(
                                item,
                                brandName,
                                brandDomain,
                                idx,
                              )
                            }
                            aria-label={`Download receipt for ${desc}`}
                          >
                            Download Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Suggested Next Steps ── */}
        <hr
          style={{
            border: "none",
            borderTop: "1px solid rgba(94,240,138,0.15)",
            margin: "8px 0 32px",
          }}
        />
        <SuggestedNextSteps />
      </div>
    </PortalLayout>
  );
}
