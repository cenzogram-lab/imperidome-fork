import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Invoice, backendInterface } from "../../backend";
import { EditableText } from "../../components/EditableText";
import { useActor } from "../../hooks/useActor";
import PortalLayout from "./PortalLayout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(ts: bigint | undefined): string {
  if (!ts) return "—";
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
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Ad-hoc invoice shape returned by getMyAdHocInvoices()
// ---------------------------------------------------------------------------
interface AdHocInvoice {
  id: bigint;
  description: string;
  amount: number; // in dollars
  status: string; // 'pending' | 'paid'
  createdAt: bigint;
  paidAt?: bigint;
  invoiceNumber: string;
}

// ---------------------------------------------------------------------------
// Unified display row — merges Invoice and AdHocInvoice
// ---------------------------------------------------------------------------
interface DisplayInvoice {
  key: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  dueDate?: bigint;
  paidAt?: bigint;
  status: string; // 'PAID' | 'PENDING' | 'OVERDUE'
  type: "standard" | "adhoc";
  originalInvoice?: Invoice; // for receipt printing
  adhocId?: string; // for Pay Now on ad-hoc
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  PAID: { label: "PAID", bg: "#166534", color: "#ffffff" },
  OVERDUE: { label: "OVERDUE", bg: "#991B1B", color: "#ffffff" },
  PENDING: { label: "PENDING", bg: "#EAB308", color: "#ffffff" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status.toUpperCase()] ?? {
    label: status,
    bg: "#6B7280",
    color: "#fff",
  };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Type badge for Custom Charge
// ---------------------------------------------------------------------------
function TypeBadge({ type }: { type: "standard" | "adhoc" }) {
  if (type === "standard") return null;
  return (
    <span
      style={{
        display: "inline-block",
        marginLeft: "6px",
        padding: "1px 8px",
        borderRadius: "9999px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: "rgba(57,255,20,0.12)",
        color: "#39FF14",
        border: "1px solid rgba(57,255,20,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      Custom Charge
    </span>
  );
}

// ---------------------------------------------------------------------------
// PDF receipt — uses a hidden print-only iframe with branded invoice layout.
// The browser's "Save as PDF" option in the print dialog produces the file.
// CSS hides all other content so only the invoice iframe prints.
// ---------------------------------------------------------------------------
function downloadInvoicePDF(invoice: Invoice) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const iframeId = "imperidome-pdf-frame";
  const existing = document.getElementById(iframeId);
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = iframeId;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;";
  document.body.appendChild(iframe);

  const invoiceDate = formatDate(invoice.due_date);
  const paidDate = formatDate(invoice.paid_at);
  const totalAmount = formatAmount(invoice.amount);
  const invoiceNumber = esc(invoice.invoice_number);
  const description = esc(invoice.description);
  const statusLabel = esc(invoice.status);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNumber} — Imperidome</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page {
    size: A4;
    margin: 0;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #ffffff;
    color: #1B2D4F;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  /* Header band */
  .header {
    background: #0D0F1E;
    color: #ffffff;
    padding: 36px 48px 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header .brand {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 0.12em;
    color: #5EF08A;
  }
  .header .brand-tagline {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .header .invoice-label {
    text-align: right;
  }
  .header .invoice-label .inv-title {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .header .invoice-label .inv-number {
    font-size: 14px;
    color: #5EF08A;
    margin-top: 4px;
    font-weight: 600;
  }

  /* Accent line */
  .accent-bar {
    height: 4px;
    background: linear-gradient(90deg, #5EF08A 0%, #1B2D4F 100%);
  }

  /* Body */
  .body {
    padding: 40px 48px;
    flex: 1;
  }

  /* Meta grid */
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
  }
  .meta-block .meta-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #7A7D90;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .meta-block .meta-value {
    font-size: 15px;
    color: #1B2D4F;
    font-weight: 500;
  }

  /* Line items table */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 32px;
  }
  .items-table thead tr {
    background: #0D0F1E;
    color: #ffffff;
  }
  .items-table thead th {
    padding: 12px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .items-table thead th:last-child {
    text-align: right;
  }
  .items-table tbody tr {
    border-bottom: 1px solid #E2E8F0;
  }
  .items-table tbody td {
    padding: 14px 16px;
    font-size: 14px;
    color: #1B2D4F;
    vertical-align: top;
  }
  .items-table tbody td:last-child {
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Totals */
  .totals {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
  .totals-box {
    width: 280px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    border-bottom: 1px solid #E2E8F0;
  }
  .totals-row .t-label { color: #6B7280; }
  .totals-row .t-value { font-weight: 500; color: #1B2D4F; }
  .totals-row.grand {
    border-bottom: 2px solid #0D0F1E;
    padding: 10px 0;
  }
  .totals-row.grand .t-label {
    font-weight: 700;
    color: #0D0F1E;
    font-size: 16px;
  }
  .totals-row.grand .t-value {
    font-weight: 800;
    color: #0D0F1E;
    font-size: 16px;
  }

  /* Status pill */
  .status-pill {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .status-PAID { background: #166534; color: #ffffff; }
  .status-PENDING { background: #EAB308; color: #ffffff; }
  .status-OVERDUE { background: #991B1B; color: #ffffff; }

  /* Footer */
  .footer {
    padding: 24px 48px;
    border-top: 2px solid #0D0F1E;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer .footer-brand {
    font-size: 13px;
    color: #6B7280;
  }
  .footer .footer-brand strong {
    color: #1B2D4F;
  }
  .footer .footer-contact {
    font-size: 12px;
    color: #6B7280;
    text-align: right;
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">IMPERIDOME</div>
      <div class="brand-tagline">Web Design &amp; Digital Solutions</div>
    </div>
    <div class="invoice-label">
      <div class="inv-title">Invoice</div>
      <div class="inv-number">${invoiceNumber}</div>
    </div>
  </div>
  <div class="accent-bar"></div>
  <div class="body">
    <div class="meta-grid">
      <div class="meta-block">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-value">${invoiceNumber}</div>
      </div>
      <div class="meta-block">
        <div class="meta-label">Status</div>
        <div class="meta-value">
          <span class="status-pill status-${esc(invoice.status.toUpperCase())}">${statusLabel}</span>
        </div>
      </div>
      <div class="meta-block">
        <div class="meta-label">Due Date</div>
        <div class="meta-value">${invoiceDate}</div>
      </div>
      <div class="meta-block">
        <div class="meta-label">Date Paid</div>
        <div class="meta-value">${paidDate}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${description}</td>
          <td>1</td>
          <td>${totalAmount}</td>
          <td>${totalAmount}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span class="t-label">Subtotal</span>
          <span class="t-value">${totalAmount}</span>
        </div>
        <div class="totals-row">
          <span class="t-label">Tax</span>
          <span class="t-value">$0.00</span>
        </div>
        <div class="totals-row grand">
          <span class="t-label">Total Due</span>
          <span class="t-value">${totalAmount}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-brand">
      Thank you for your business &mdash; <strong>Imperidome</strong>
    </div>
    <div class="footer-contact">
      www.imperidome.com
    </div>
  </div>
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

  // Wait for content to render, then trigger print dialog
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback: open in new tab
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setTimeout(() => iframe.remove(), 2000);
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
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
// Table component
// ---------------------------------------------------------------------------
interface InvoiceTableProps {
  invoices: DisplayInvoice[];
  section: "outstanding" | "history";
  payingId: string | null;
  onPay: (inv: DisplayInvoice) => void;
  onDownload: (inv: DisplayInvoice) => void;
}

const TABLE_HEADERS = [
  "Invoice #",
  "Description",
  "Amount",
  "Due Date",
  "Status",
  "Action",
];

function InvoiceTable({
  invoices,
  section,
  payingId,
  onPay,
  onDownload,
}: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div
        data-ocid={`invoices.${section}.empty_state`}
        style={{
          textAlign: "center",
          color: "#7A7D90",
          padding: "32px 0",
          fontSize: "15px",
        }}
      >
        <EditableText
          textKey={`portal.invoices.${section}.empty-state`}
          defaultText={
            section === "outstanding"
              ? "No outstanding invoices. You are all caught up."
              : "No invoice history yet."
          }
          as="span"
        />
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }} data-ocid={`invoices.${section}.table`}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
          minWidth: "640px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #1C1F33" }}>
            {TABLE_HEADERS.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  color: "#7A7D90",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, idx) => {
            const rowIdx = idx + 1;
            const isPayable =
              inv.status === "PENDING" || inv.status === "OVERDUE";
            const isPaying = payingId === inv.key;

            return (
              <tr
                key={inv.key}
                data-ocid={`invoices.${section}.row.${rowIdx}`}
                style={{
                  borderBottom: "1px solid #1C1F33",
                  background:
                    idx % 2 === 0 ? "rgba(17,19,34,0.7)" : "rgba(14,16,32,0.9)",
                }}
              >
                <td
                  style={{
                    padding: "14px 12px",
                    minWidth: "140px",
                    fontWeight: 600,
                    color: "#EEF0F8",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inv.invoiceNumber}
                  <TypeBadge type={inv.type} />
                </td>
                <td style={{ padding: "14px 12px", color: "#7A7D90" }}>
                  {inv.description}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "#EEF0F8",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatAmount(inv.amount)}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "#7A7D90",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate(inv.dueDate)}
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <StatusBadge status={inv.status} />
                </td>
                <td style={{ padding: "14px 12px" }}>
                  {isPayable ? (
                    <button
                      type="button"
                      data-ocid={`invoices.${section}.pay_button.${rowIdx}`}
                      onClick={() => onPay(inv)}
                      disabled={isPaying}
                      style={{
                        background: "#5EF08A",
                        color: "#061209",
                        border: "none",
                        borderRadius: "6px",
                        padding: "10px 14px",
                        minHeight: "44px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: isPaying ? "not-allowed" : "pointer",
                        opacity: isPaying ? 0.7 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isPaying && (
                        <Loader2
                          size={13}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      )}
                      {isPaying ? "Redirecting..." : "Pay Now"}
                    </button>
                  ) : (
                    inv.originalInvoice && (
                      <button
                        type="button"
                        data-ocid={`invoices.${section}.download_button.${rowIdx}`}
                        onClick={() => onDownload(inv)}
                        title="Download PDF Receipt"
                        style={{
                          background: "transparent",
                          border: "1px solid #5EF08A",
                          borderRadius: "6px",
                          padding: "10px 10px",
                          minHeight: "44px",
                          cursor: "pointer",
                          color: "#5EF08A",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        <Download size={13} />
                        PDF
                      </button>
                    )
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PortalInvoicesPage() {
  const { actor, isFetching } = useActor();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [adHocInvoices, setAdHocInvoices] = useState<AdHocInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Pay Now state (redirect flow — no modal needed)
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    loadInvoices();
  }, [actor, isFetching]);

  async function loadInvoices() {
    if (!actor) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [stdResult, adHocResult] = await Promise.all([
        actor.getMyInvoices(),
        (actor as backendInterface).getMyAdHocInvoices(),
      ]);
      setInvoices(stdResult);
      setAdHocInvoices(Array.isArray(adHocResult) ? adHocResult : []);
    } catch {
      setFetchError("Failed to load invoices. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Merge standard + ad-hoc invoices into unified display rows
  function buildDisplayInvoices(
    stdList: Invoice[],
    adhocList: AdHocInvoice[],
  ): DisplayInvoice[] {
    const std: DisplayInvoice[] = stdList.map((inv) => ({
      key: `std-${String(inv.id)}`,
      invoiceNumber: inv.invoice_number,
      description: inv.description,
      amount: inv.amount,
      dueDate: inv.due_date,
      paidAt: inv.paid_at,
      status: inv.status,
      type: "standard" as const,
      originalInvoice: inv,
    }));

    // ─── snake_case → camelCase field mapping ────────────────────────────────────
    // The backend returns ad-hoc invoices with camelCase field names from the
    // Motoko type. This mapping normalises them to the DisplayInvoice shape.
    //
    //   Backend field (AdHocInvoice)  →  DisplayInvoice field
    //   inv.invoiceNumber              →  invoiceNumber
    //   inv.description                →  description
    //   inv.amount                     →  amount
    //   inv.createdAt                  →  dueDate  (used as the display date)
    //   inv.paidAt                     →  paidAt
    //   inv.status ("paid"|"pending")  →  status (normalised to "PAID"|"PENDING")
    //   inv.id                         →  adhocId  (as string)
    //
    // WARNING: If the backend renames any of these fields, the mapping below
    // will silently break at runtime. Update both this comment and the mapping.
    // ─────────────────────────────────────────────────────────────────────────────
    const adhoc: DisplayInvoice[] = adhocList.map((inv) => ({
      key: `adhoc-${String(inv.id)}`,
      invoiceNumber:
        inv.invoiceNumber ?? `#${String(inv.id).slice(0, 8).toUpperCase()}`,
      description: inv.description,
      amount: inv.amount,
      dueDate: inv.createdAt,
      paidAt: inv.paidAt,
      status: inv.status === "paid" ? "PAID" : "PENDING",
      type: "adhoc" as const,
      adhocId: String(inv.id),
    }));

    return [...std, ...adhoc];
  }

  async function handlePayNow(inv: DisplayInvoice) {
    if (!actor) return;
    setPayError(null);
    setPayingId(inv.key);

    try {
      const amountCents = BigInt(Math.round(inv.amount * 100));
      const invoiceId =
        inv.type === "adhoc"
          ? inv.adhocId!
          : String((inv.originalInvoice as Invoice).id);
      const result = await (
        actor as backendInterface
      ).createStripePaymentSession(
        invoiceId,
        amountCents,
        `${window.location.origin}/portal/invoices?paid=1`,
        `${window.location.origin}/portal/invoices?cancelled=1`,
      );

      // Result is { __kind__: "ok", ok: string } or { __kind__: "err", err: string }
      if (result.__kind__ === "ok") {
        // #ok variant — redirect to Stripe checkout
        const checkoutUrl = result.ok;
        if (checkoutUrl?.startsWith("http")) {
          window.location.href = checkoutUrl;
        } else {
          setPayError(
            "Checkout session created but the URL was invalid. Please try again or contact support.",
          );
          setPayingId(null);
        }
      } else if (result.__kind__ === "err") {
        // #err variant — show specific backend message if available
        const errMsg = result.err
          ? result.err
          : "Payment setup failed. Please contact support if this persists.";
        setPayError(errMsg);
        setPayingId(null);
      } else {
        // Unexpected shape — clear actionable message with retry guidance
        setPayError(
          "Something went wrong with checkout. Please dismiss this message and try again, or contact support.",
        );
        setPayingId(null);
      }
    } catch {
      setPayError("Failed to initialize payment. Please try again.");
      setPayingId(null);
    }
  }

  function handleDownload(inv: DisplayInvoice) {
    if (inv.originalInvoice) {
      downloadInvoicePDF(inv.originalInvoice);
    }
  }

  const allInvoices = buildDisplayInvoices(invoices, adHocInvoices);

  const outstanding = allInvoices.filter(
    (inv) => inv.status === "PENDING" || inv.status === "OVERDUE",
  );
  const history = allInvoices.filter((inv) => inv.status === "PAID");

  const sectionCard: React.CSSProperties = {
    background: "rgba(17,19,34,0.7)",
    borderRadius: "8px",
    padding: "24px",
    border: "1px solid #1C1F33",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "24px",
  };

  const h3Style: React.CSSProperties = {
    margin: "0 0 20px",
    color: "#EEF0F8",
    fontSize: "17px",
    fontWeight: 700,
  };

  return (
    <PortalLayout pageTitle="Invoices">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div
        data-ocid="invoices.page"
        style={{ padding: "0", maxWidth: "100%", boxSizing: "border-box" }}
      >
        {/* Loading state */}
        {loading && (
          <div data-ocid="invoices.loading_state">
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
            <div style={sectionCard}>
              <Skeleton
                style={{ height: "22px", width: "160px", marginBottom: "20px" }}
              />
              {[1, 2].map((i) => (
                <Skeleton
                  key={i}
                  style={{ height: "48px", marginBottom: "8px" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div
            data-ocid="invoices.error_state"
            style={{
              background: "#FEF2F2",
              border: "1px solid #1C1F33",
              borderRadius: "8px",
              padding: "20px 24px",
              color: "#991B1B",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            {fetchError}
          </div>
        )}

        {/* Pay error banner */}
        {payError && (
          <div
            data-ocid="invoices.pay.error_state"
            style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              padding: "14px 18px",
              color: "#991B1B",
              fontSize: "14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{payError}</span>
            <button
              type="button"
              onClick={() => setPayError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#991B1B",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1,
                padding: "0 4px",
              }}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !fetchError && (
          <>
            {/* Outstanding invoices */}
            <section
              data-ocid="invoices.outstanding.section"
              style={sectionCard}
            >
              <h3 style={h3Style}>
                <EditableText
                  textKey="portal.invoices.outstanding.heading"
                  defaultText="Outstanding Invoices"
                  as="span"
                />
              </h3>
              <InvoiceTable
                invoices={outstanding}
                section="outstanding"
                payingId={payingId}
                onPay={handlePayNow}
                onDownload={handleDownload}
              />
            </section>

            {/* Invoice history */}
            <section
              data-ocid="invoices.history.section"
              style={{ ...sectionCard, marginBottom: 0 }}
            >
              <h3 style={h3Style}>
                <EditableText
                  textKey="portal.invoices.history.heading"
                  defaultText="Invoice History"
                  as="span"
                />
              </h3>
              <InvoiceTable
                invoices={history}
                section="history"
                payingId={null}
                onPay={handlePayNow}
                onDownload={handleDownload}
              />
            </section>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
