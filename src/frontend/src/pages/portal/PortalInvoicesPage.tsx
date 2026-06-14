import { Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { AdHocInvoice, Invoice, backendInterface } from "../../backend.d";
import { EditableText } from "../../components/EditableText";
import TypewriterText from "../../components/TypewriterText";
import { useActor } from "../../hooks/useActor";
import { useSession } from "../../hooks/useSession";
import PortalLayout from "./PortalLayout";

function formatDate(ts: bigint | undefined): string {
  if (ts === undefined || ts === null || ts === 0n) return "—";
  if (Number.isNaN(Number(ts))) return "—";
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

interface DisplayInvoice {
  key: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  dueDate?: bigint;
  paidAt?: bigint;
  status: string;
  type: "standard" | "adhoc";
  originalInvoice?: Invoice;
  adhocId?: string;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === "PAID") return <span className="matrix-badge">PAID</span>;
  if (s === "OVERDUE") return <span className="matrix-badge-red">OVERDUE</span>;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: "rgba(234,179,8,0.1)",
        color: "#EAB308",
        border: "1px solid rgba(234,179,8,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      PENDING
    </span>
  );
}

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
        background: "rgba(94,240,138,0.12)",
        color: "#5EF08A",
        border: "1px solid rgba(94,240,138,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      Custom Charge
    </span>
  );
}

function downloadInvoicePDF(
  invoice: Invoice,
  brandName: string,
  brandDomain: string,
  clientEmail: string,
) {
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
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Invoice ${invoiceNumber} — ${brandName}</title><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}@page{size:A4;margin:0}body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1B2D4F;print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{width:210mm;min-height:297mm;display:flex;flex-direction:column}.header{background:#0D0F1E;color:#fff;padding:36px 48px 28px;display:flex;justify-content:space-between;align-items:flex-end}.brand{font-size:28px;font-weight:900;letter-spacing:.12em;color:#5EF08A}.brand-tagline{font-size:11px;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase;margin-top:4px}.invoice-label{text-align:right}.inv-title{font-size:20px;font-weight:700;color:#fff;letter-spacing:.06em;text-transform:uppercase}.inv-number{font-size:14px;color:#5EF08A;margin-top:4px;font-weight:600}.accent-bar{height:4px;background:linear-gradient(90deg,#5EF08A 0%,#1B2D4F 100%)}.body{padding:40px 48px;flex:1}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px}.meta-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7A7D90;margin-bottom:4px;font-weight:600}.meta-value{font-size:15px;color:#1B2D4F;font-weight:500}.items-table{width:100%;border-collapse:collapse;margin-bottom:32px}.items-table thead tr{background:#0D0F1E;color:#fff}.items-table thead th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.items-table thead th:last-child{text-align:right}.items-table tbody tr{border-bottom:1px solid #E2E8F0}.items-table tbody td{padding:14px 16px;font-size:14px;color:#1B2D4F;vertical-align:top}.items-table tbody td:last-child{text-align:right;font-weight:600;white-space:nowrap}.totals{display:flex;justify-content:flex-end;margin-top:8px}.totals-box{width:280px}.totals-row{display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:#4A5568}.totals-row.total{border-top:2px solid #0D0F1E;margin-top:4px;padding-top:12px;font-size:17px;font-weight:700;color:#0D0F1E}.footer{background:#F7F9FC;border-top:1px solid #E2E8F0;padding:20px 48px;display:flex;justify-content:space-between;align-items:center}.footer-brand{font-size:13px;font-weight:700;color:#0D0F1E;letter-spacing:.06em}.footer-contact{font-size:12px;color:#7A7D90}</style></head><body><div class="page"><div class="header"><div><div class="brand">${brandName}</div><div class="brand-tagline">Professional Services</div></div><div class="invoice-label"><div class="inv-title">Invoice</div><div class="inv-number">#${invoiceNumber}</div></div></div><div class="accent-bar"></div><div class="body"><div class="meta-grid"><div><div class="meta-label">Billed To</div><div class="meta-value">${esc(clientEmail)}</div></div><div><div class="meta-label">Invoice Date</div><div class="meta-value">${invoiceDate}</div></div><div><div class="meta-label">Status</div><div class="meta-value">${statusLabel}</div></div>${invoice.paid_at ? `<div><div class="meta-label">Paid On</div><div class="meta-value">${paidDate}</div></div>` : ""}</div><table class="items-table"><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>${description}</td><td>$${totalAmount}</td></tr></tbody></table><div class="totals"><div class="totals-box"><div class="totals-row total"><span>Total Due</span><span>$${totalAmount}</span></div></div></div></div><div class="footer"><div class="footer-brand">${brandName}</div><div class="footer-contact">${brandDomain}</div></div></div></body></html>`;
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
      a.download = `invoice-${invoice.invoice_number}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setTimeout(() => iframe.remove(), 2000);
  };
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
}: {
  invoices: DisplayInvoice[];
  section: "outstanding" | "history";
  payingId: string | null;
  onPay: (inv: DisplayInvoice) => void;
  onDownload: (inv: DisplayInvoice) => void;
}) {
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
        className="matrix-table"
        style={{ width: "100%", fontSize: "14px", minWidth: "640px" }}
      >
        <thead>
          <tr>
            {TABLE_HEADERS.map((h) => (
              <th key={h}>
                <TypewriterText text={h} as="span" speed={40} />
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
                style={{ animation: "typewriter-fade-in 0.4s ease forwards" }}
              >
                <td
                  style={{
                    minWidth: "140px",
                    fontWeight: 600,
                    color: "#EEF0F8",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inv.invoiceNumber}
                  <TypeBadge type={inv.type} />
                </td>
                <td style={{ color: "#7A7D90" }}>{inv.description}</td>
                <td
                  style={{
                    color: "#5EF08A",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                  }}
                >
                  {formatAmount(inv.amount)}
                </td>
                <td
                  style={{
                    color: "#7A7D90",
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                  }}
                >
                  {formatDate(inv.dueDate)}
                </td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
                <td>
                  <div
                    style={{
                      display: "inline-flex",
                      gap: "6px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {isPayable && (
                      <button
                        type="button"
                        data-ocid={`invoices.${section}.pay_button.${rowIdx}`}
                        onClick={() => onPay(inv)}
                        disabled={isPaying}
                        className="matrix-btn"
                        style={{
                          padding: "10px 14px",
                          minHeight: "44px",
                          fontSize: "13px",
                          opacity: isPaying ? 0.7 : 1,
                          cursor: isPaying ? "not-allowed" : "pointer",
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
                    )}
                    {inv.originalInvoice ? (
                      <button
                        type="button"
                        data-ocid={`invoices.${section}.download_button.${rowIdx}`}
                        onClick={() => onDownload(inv)}
                        title="Download PDF"
                        className="matrix-btn-outline"
                        style={{
                          padding: "10px",
                          minHeight: "44px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Download size={13} /> Download PDF
                      </button>
                    ) : inv.type === "adhoc" ? (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "rgba(122,125,144,0.7)",
                          fontStyle: "italic",
                          whiteSpace: "nowrap",
                        }}
                      >
                        No receipt available
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PortalInvoicesPage() {
  const { session } = useSession();
  const userEmail = session?.email ?? "";
  const { actor, isFetching } = useActor();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [adHocInvoices, setAdHocInvoices] = useState<AdHocInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [paymentConfirmMsg, setPaymentConfirmMsg] = useState<string | null>(
    null,
  );
  const [urlError, setUrlError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    if (!actor || !userEmail) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [stdResult, adHocResult] = await Promise.all([
        (actor as backendInterface).getMyInvoices(),
        (actor as backendInterface).getMyAdHocInvoices(),
      ]);
      setInvoices(stdResult);
      setAdHocInvoices(Array.isArray(adHocResult) ? adHocResult : []);
    } catch {
      setFetchError("Failed to load invoices. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [actor, userEmail]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!actor || isFetching) return;
    const searchParams = new URLSearchParams(window.location.search);
    const isPaidRedirect =
      searchParams.get("paid") === "1" ||
      searchParams.get("payment_success") === "true";
    if (isPaidRedirect) {
      setPaymentPolling(true);
      setPaymentConfirmMsg("Confirming your payment...");
      let attempts = 0;
      const doPoll = () => {
        if (attempts >= 5) {
          setPaymentPolling(false);
          setPaymentConfirmMsg(
            "Payment received. Your invoice status will update shortly.",
          );
          return;
        }
        attempts++;
        loadInvoices().then(() => {
          setTimeout(doPoll, 2000);
        });
      };
      setTimeout(doPoll, 500);
      return; // polling handles the load for redirect case
    }
    loadInvoices();
  }, [actor, isFetching, loadInvoices]);

  useEffect(() => {
    if (!actor) return;
    actor
      .getAdminContactEmail()
      .then((email: string) => {
        if (email) {
          const domain = email.split("@")[1] ?? "imperidome.com";
          setBrandDomain(domain);
          setBrandName(domain.split(".")[0]?.toUpperCase() ?? "IMPERIDOME");
        }
      })
      .catch(() => {});
  }, [actor]);

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
    const adhoc: DisplayInvoice[] = adhocList.map((inv) => ({
      key: `adhoc-${String(inv.id)}`,
      invoiceNumber:
        inv.invoiceNumber ?? `#${String(inv.id).slice(0, 8).toUpperCase()}`,
      description: inv.description,
      amount: Number(inv.amount),
      dueDate: inv.createdAt,
      paidAt: inv.paidAt,
      status: inv.status === "paid" ? "PAID" : "PENDING",
      type: "adhoc" as const,
      adhocId: String(inv.id),
    }));
    return [...std, ...adhoc];
  }

  async function handlePayNow(inv: DisplayInvoice) {
    if (!actor || !userEmail) return;
    setPayError(null);
    setPayingId(inv.key);
    try {
      // Guard against NaN/undefined/null amounts to prevent BigInt(NaN) crash
      const safeAmount =
        typeof inv.amount === "number" && Number.isFinite(inv.amount)
          ? inv.amount
          : 0;
      const amountCents = BigInt(Math.round(safeAmount * 100));
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
      if ("ok" in result) {
        const checkoutUrl = result.ok;
        if (!checkoutUrl?.startsWith("https://")) {
          setUrlError("Payment URL must use a secure connection (HTTPS).");
          setPayingId(null);
        } else {
          setUrlError(null);
          window.location.href = checkoutUrl;
        }
      } else if ("err" in result) {
        setPayError(
          result.err
            ? result.err
            : "Payment setup failed. Please contact support if this persists.",
        );
        setPayingId(null);
      } else {
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
    if (inv.originalInvoice)
      downloadInvoicePDF(
        inv.originalInvoice,
        brandName,
        brandDomain,
        userEmail,
      );
  }

  const allInvoices = buildDisplayInvoices(invoices, adHocInvoices);
  const outstanding = allInvoices.filter(
    (inv) => inv.status === "PENDING" || inv.status === "OVERDUE",
  );
  const history = allInvoices.filter((inv) => {
    const s = inv.status.toUpperCase();
    return (
      s === "PAID" || s === "CANCELED" || s === "VOIDED" || s === "CANCELLED"
    );
  });

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
    <PortalLayout pageTitle="Invoices">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes typewriter-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        data-ocid="invoices.page"
        style={{ padding: "0", maxWidth: "100%", boxSizing: "border-box" }}
      >
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
          </div>
        )}

        {!loading && fetchError && (
          <div
            data-ocid="invoices.error_state"
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

        {paymentConfirmMsg && (
          <div
            data-ocid="invoices.payment_confirm.success_state"
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: "8px",
              padding: "14px 18px",
              color: "#60a5fa",
              fontSize: "14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {paymentPolling && (
              <span
                style={{
                  display: "inline-block",
                  animation: "spin 1s linear infinite",
                }}
                aria-hidden="true"
              >
                ↻
              </span>
            )}
            <span>{paymentConfirmMsg}</span>
          </div>
        )}

        {urlError && (
          <div
            data-ocid="invoices.url.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "14px 18px",
              color: "#EF4444",
              fontSize: "14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{urlError}</span>
            <button
              type="button"
              onClick={() => setUrlError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#EF4444",
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

        {payError && (
          <div
            data-ocid="invoices.pay.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "14px 18px",
              color: "#EF4444",
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
                color: "#EF4444",
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

        {!loading && !fetchError && (
          <>
            <section
              data-ocid="invoices.outstanding.section"
              style={sectionCard}
            >
              <h3 style={{ margin: "0 0 20px" }}>
                <TypewriterText
                  text="Outstanding Invoices"
                  className="matrix-heading"
                  style={{ fontSize: "17px", fontWeight: 700 }}
                  speed={40}
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
            <section
              data-ocid="invoices.history.section"
              style={{ ...sectionCard, marginBottom: 0 }}
            >
              <h3 style={{ margin: "0 0 20px" }}>
                <TypewriterText
                  text="Invoice History"
                  className="matrix-heading"
                  style={{ fontSize: "17px", fontWeight: 700 }}
                  speed={40}
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
